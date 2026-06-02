import { it } from "@effect/vitest"
import { describe, expect } from "vitest"
import { Effect } from "effect"
import { ShortCode } from "../src/domain/schema"
import { visit } from "../src/core/visit"
import { InMemoryLinkStore } from "./support/inMemory"

const seed: any[] = [{ shortCode: "abc123", url: "https://x.com", createdAt: 1, clicks: 0 }]

describe("visit", () => {
  it.effect("returns the url and the incremented click count", () =>
    Effect.gen(function* () {
      const result = yield* visit(ShortCode.make("abc123")).pipe(Effect.provide(InMemoryLinkStore({ seed })))
      expect(result.url).toBe("https://x.com")
      expect(result.clicks).toBe(1)
    }),
  )

  it.effect("still redirects when the click increment fails", () =>
    Effect.gen(function* () {
      const result = yield* visit(ShortCode.make("abc123")).pipe(
        Effect.provide(InMemoryLinkStore({ seed, failIncrement: true })),
      )
      expect(result.url).toBe("https://x.com")
      expect(result.clicks).toBeUndefined()
    }),
  )
})
