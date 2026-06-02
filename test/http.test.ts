import { it } from "@effect/vitest"
import { describe, expect, test } from "vitest"
import { Effect, Exit } from "effect"
import { decodeBody, json, redirect } from "../src/http"
import { presentCreated } from "../src/domain/present"

const event = (body: string | null) => ({ body }) as any

describe("http helpers", () => {
  test("json sets status, content-type and stringified body", () => {
    const r = json(201, { ok: true })
    expect(r.statusCode).toBe(201)
    expect(r.headers?.["content-type"]).toBe("application/json")
    expect(JSON.parse(r.body!)).toEqual({ ok: true })
  })

  test("redirect sets 301 + Location and optional click header", () => {
    expect(redirect("https://x.com", 5).headers?.Location).toBe("https://x.com")
    expect(redirect("https://x.com", 5).headers?.["X-Click-Count"]).toBe("5")
    expect(redirect("https://x.com", undefined).headers?.["X-Click-Count"]).toBeUndefined()
  })

  test("presentCreated builds the short url and omits absent expiresAt", () => {
    const out = presentCreated(
      { shortCode: "abc123" as any, url: "https://x.com", createdAt: 1, clicks: 0 },
      "https://s.example",
    )
    expect(out.shortUrl).toBe("https://s.example/abc123")
    expect("expiresAt" in out).toBe(false)
  })

  it.effect("decodeBody parses a valid body", () =>
    Effect.gen(function* () {
      const r = yield* decodeBody(event(JSON.stringify({ url: "https://x.com" })))
      expect(r.url).toBe("https://x.com")
    }),
  )

  it.effect("decodeBody fails InvalidRequest on bad JSON", () =>
    Effect.gen(function* () {
      const exit = yield* decodeBody(event("{not json")).pipe(Effect.exit)
      expect(Exit.isFailure(exit)).toBe(true)
    }),
  )

  it.effect("decodeBody fails InvalidRequest on a bad url", () =>
    Effect.gen(function* () {
      const exit = yield* decodeBody(event(JSON.stringify({ url: "nope" }))).pipe(Effect.exit)
      expect(Exit.isFailure(exit)).toBe(true)
    }),
  )
})
