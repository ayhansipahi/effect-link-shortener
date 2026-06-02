import { createServer } from "node:http"
import type { IncomingMessage, ServerResponse } from "node:http"
import { Layer, ManagedRuntime } from "effect"
import { CodeGen } from "../src/services/CodeGen"
import { LinkStoreLocal } from "../src/services/LinkStoreLocal"
import { json, withErrorMapping } from "../src/http"
import { createProgram, redirectProgram } from "../src/programs"

const PORT = Number(process.env.PORT ?? 3000)
const runtime = ManagedRuntime.make(Layer.mergeAll(CodeGen.Default, LinkStoreLocal))

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    let data = ""
    req.on("data", (c: Buffer) => (data += c.toString()))
    req.on("end", () => resolve(data))
    req.on("error", reject)
  })

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)
  const method = req.method ?? "GET"
  const baseUrl = `http://localhost:${PORT}`
  try {
    let result
    if (method === "POST" && url.pathname === "/links") {
      result = await runtime.runPromise(withErrorMapping(createProgram(await readBody(req), baseUrl)))
    } else if (method === "GET" && url.pathname.length > 1) {
      result = await runtime.runPromise(withErrorMapping(redirectProgram(url.pathname.slice(1))))
    } else {
      result = json(404, { error: "NotFound" })
    }
    res.writeHead(result.statusCode ?? 200, result.headers as Record<string, string>)
    res.end(result.body ?? "")
  } catch {
    res.writeHead(500, { "content-type": "application/json" })
    res.end(JSON.stringify({ error: "InternalError" }))
  }
})

server.listen(PORT, () => console.warn(`link-shortener local server on http://localhost:${PORT}`))
