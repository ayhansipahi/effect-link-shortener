import { describe, expect, test } from "vitest"
import { Effect } from "effect"
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda"
import { json, withErrorMapping } from "../src/http"
import {
  InvalidRequest,
  LinkExpired,
  ShortCodeNotFound,
  ShortCodeTaken,
  StoreUnavailable,
} from "../src/domain/errors"

const status = (e: any) =>
  Effect.runPromise(
    withErrorMapping(Effect.fail(e)).pipe(
      Effect.map((r: APIGatewayProxyStructuredResultV2) => r.statusCode),
    ),
  )

describe("withErrorMapping", () => {
  test("passes a success through unchanged", async () => {
    const r = await Effect.runPromise(withErrorMapping(Effect.succeed(json(201, { ok: true }))))
    expect(r.statusCode).toBe(201)
  })

  test("maps each tagged error to its status", async () => {
    expect(await status(new InvalidRequest({ issues: [] }))).toBe(400)
    expect(await status(new ShortCodeTaken({ shortCode: "x" }))).toBe(409)
    expect(await status(new ShortCodeNotFound({ shortCode: "x" }))).toBe(404)
    expect(await status(new LinkExpired({ shortCode: "x" }))).toBe(410)
    expect(await status(new StoreUnavailable({ cause: "x" }))).toBe(500)
  })

  test("maps an unexpected defect to 500", async () => {
    const r = await Effect.runPromise(
      withErrorMapping(Effect.die(new Error("boom"))),
    )
    expect(r.statusCode).toBe(500)
  })
})
