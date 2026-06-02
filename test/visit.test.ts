import { describe, expect, test } from "vitest"
import { Effect, Layer } from "effect"
import { ShortCode } from "../src/domain/schema"
import { visit } from "../src/core/visit"
import { InMemoryLinkStore } from "./support/inMemory"

const seed = [{ shortCode: "abc123", url: "https://x.com", createdAt: 1, clicks: 0 }]

describe("visit", () => {
  test("returns the url and the incremented click count", async () => {
    const result = await Effect.runPromise(
      visit(ShortCode.make("abc123")).pipe(Effect.provide(InMemoryLinkStore({ seed }))),
    )
    expect(result.url).toBe("https://x.com")
    expect(result.clicks).toBe(1)
  })

  test("still redirects when the click increment fails", async () => {
    const result = await Effect.runPromise(
      visit(ShortCode.make("abc123")).pipe(
        Effect.provide(InMemoryLinkStore({ seed, failIncrement: true })),
      ),
    )
    expect(result.url).toBe("https://x.com")
    expect(result.clicks).toBeUndefined()
  })
})
