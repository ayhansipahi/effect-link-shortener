import { expect, test } from "vitest"
import { Effect } from "effect"
import { ShortCode } from "../../src/domain/schema"
import { LinkStore } from "../../src/services/LinkStore"
import { InMemoryLinkStore } from "./inMemory"

test("in-memory store round-trips create then get", async () => {
  const code = ShortCode.make("abc123")
  const found = await Effect.runPromise(
    Effect.gen(function* () {
      const store = yield* LinkStore
      yield* store.create({ shortCode: code, url: "https://x.com", createdAt: 1, clicks: 0 })
      return yield* store.get(code)
    }).pipe(Effect.provide(InMemoryLinkStore())),
  )
  expect(found.url).toBe("https://x.com")
})
