import { it } from "@effect/vitest"
import { expect } from "vitest"
import { Effect } from "effect"
import { ShortCode } from "../../src/domain/schema"
import { LinkStore } from "../../src/services/LinkStore"
import { InMemoryLinkStore } from "./inMemory"

it.effect("in-memory store round-trips create then get", () =>
  Effect.gen(function* () {
    const code = ShortCode.make("abc123")
    const store = yield* LinkStore
    yield* store.create({ shortCode: code, url: "https://x.com", createdAt: 1, clicks: 0 })
    const found = yield* store.get(code)
    expect(found.url).toBe("https://x.com")
  }).pipe(Effect.provide(InMemoryLinkStore())),
)
