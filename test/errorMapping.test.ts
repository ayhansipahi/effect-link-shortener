import { it } from "@effect/vitest"
import { describe, expect } from "vitest"
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
  withErrorMapping(Effect.fail(e)).pipe(
    Effect.map((r: APIGatewayProxyStructuredResultV2) => r.statusCode),
  )

describe("withErrorMapping", () => {
  it.effect("passes a success through unchanged", () =>
    Effect.gen(function* () {
      const r = yield* withErrorMapping(Effect.succeed(json(201, { ok: true })))
      expect(r.statusCode).toBe(201)
    }),
  )

  it.effect("maps each tagged error to its status", () =>
    Effect.gen(function* () {
      expect(yield* status(new InvalidRequest({ issues: [] }))).toBe(400)
      expect(yield* status(new ShortCodeTaken({ shortCode: "x" }))).toBe(409)
      expect(yield* status(new ShortCodeNotFound({ shortCode: "x" }))).toBe(404)
      expect(yield* status(new LinkExpired({ shortCode: "x" }))).toBe(410)
      expect(yield* status(new StoreUnavailable({ cause: "x" }))).toBe(500)
    }),
  )

  it.effect("maps an unexpected defect to 500", () =>
    Effect.gen(function* () {
      const r = yield* withErrorMapping(Effect.die(new Error("boom")))
      expect(r.statusCode).toBe(500)
    }),
  )
})
