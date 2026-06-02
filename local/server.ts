import { createServer } from "node:http"
import type { IncomingMessage, ServerResponse } from "node:http"
import { Effect, Layer, ManagedRuntime, Schema } from "effect"
import type { APIGatewayProxyEventV2 } from "aws-lambda"
import { CodeGen } from "../src/services/CodeGen"
import { LinkStoreLocal } from "../src/services/LinkStoreLocal"
import { createLink } from "../src/core/createLink"
import { visit } from "../src/core/visit"
import { decodeBody, json, redirect, withErrorMapping } from "../src/http"
import { presentCreated } from "../src/domain/present"
import { ShortCode } from "../src/domain/schema"
import { ShortCodeNotFound } from "../src/domain/errors"

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
      const body = await readBody(req)
      const program = decodeBody({ body } as APIGatewayProxyEventV2).pipe(
        Effect.flatMap(createLink),
        Effect.map((record) => json(201, presentCreated(record, baseUrl))),
      )
      result = await runtime.runPromise(withErrorMapping(program))
    } else if (method === "GET" && url.pathname.length > 1) {
      const raw = url.pathname.slice(1)
      const program = Effect.gen(function* () {
        const code = yield* Schema.decodeUnknown(ShortCode)(raw).pipe(
          Effect.catchTag("ParseError", () => new ShortCodeNotFound({ shortCode: raw })),
        )
        const { url: target, clicks } = yield* visit(code)
        return redirect(target, clicks)
      })
      result = await runtime.runPromise(withErrorMapping(program))
    } else {
      result = json(404, { error: "NotFound" })
    }
    res.writeHead(result.statusCode ?? 200, result.headers as Record<string, string>)
    res.end(result.body ?? "")
  } catch (_err) {
    res.writeHead(500, { "content-type": "application/json" })
    res.end(JSON.stringify({ error: "InternalError" }))
  }
})

server.listen(PORT, () => console.warn(`link-shortener local server on http://localhost:${PORT}`))
