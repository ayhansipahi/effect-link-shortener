import { describe, expect, test } from "vitest"
import { Effect, Exit, Layer } from "effect"
import { ShortCode } from "../src/domain/schema"
import { resolveLink } from "../src/core/resolveLink"
import { InMemoryLinkStore } from "./support/inMemory"

const store = (seed: any[]) => Layer.merge(InMemoryLinkStore({ seed }), Layer.empty)

describe("resolveLink", () => {
  test("returns the record when present and unexpired", async () => {
    const seed = [{ shortCode: "abc123", url: "https://x.com", createdAt: 1, clicks: 0, expiresAt: 9999999999 }]
    const rec = await Effect.runPromise(
      resolveLink(ShortCode.make("abc123")).pipe(Effect.provide(store(seed))),
    )
    expect(rec.url).toBe("https://x.com")
  })

  test("fails ShortCodeNotFound when missing", async () => {
    const exit = await Effect.runPromiseExit(
      resolveLink(ShortCode.make("zzzzz")).pipe(Effect.provide(store([]))),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  test("fails LinkExpired when past expiresAt", async () => {
    const seed = [{ shortCode: "old123", url: "https://x.com", createdAt: 1, clicks: 0, expiresAt: 1 }]
    const exit = await Effect.runPromiseExit(
      resolveLink(ShortCode.make("old123")).pipe(Effect.provide(store(seed))),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })
})
