import { it } from "@effect/vitest"
import { describe, expect } from "vitest"
import { Effect, Exit, Layer } from "effect"
import { ShortCode } from "../src/domain/schema"
import { resolveLink } from "../src/core/resolveLink"
import { InMemoryLinkStore } from "./support/inMemory"

const store = (seed: any[]) => Layer.merge(InMemoryLinkStore({ seed }), Layer.empty)

describe("resolveLink", () => {
  it.effect("returns the record when present and unexpired", () =>
    Effect.gen(function* () {
      const seed = [{ shortCode: "abc123", url: "https://x.com", createdAt: 1, clicks: 0, expiresAt: 9999999999 }]
      const rec = yield* resolveLink(ShortCode.make("abc123")).pipe(Effect.provide(store(seed)))
      expect(rec.url).toBe("https://x.com")
    }),
  )

  it.effect("fails ShortCodeNotFound when missing", () =>
    Effect.gen(function* () {
      const exit = yield* resolveLink(ShortCode.make("zzzzz")).pipe(Effect.provide(store([])), Effect.exit)
      expect(Exit.isFailure(exit)).toBe(true)
    }),
  )

  it.effect("fails LinkExpired when past expiresAt", () =>
    Effect.gen(function* () {
      const seed = [{ shortCode: "old123", url: "https://x.com", createdAt: 1, clicks: 0, expiresAt: -1 }]
      const exit = yield* resolveLink(ShortCode.make("old123")).pipe(Effect.provide(store(seed)), Effect.exit)
      expect(Exit.isFailure(exit)).toBe(true)
    }),
  )
})
