import { it } from "@effect/vitest"
import { describe, expect } from "vitest"
import { Effect, Exit, Layer } from "effect"
import { ShortCode } from "../src/domain/schema"
import { createLink } from "../src/core/createLink"
import { InMemoryLinkStore, QueueCodeGen } from "./support/inMemory"

const provide = (codes: string[], seed = [] as any[]) =>
  Layer.merge(InMemoryLinkStore({ seed }), QueueCodeGen(codes))

describe("createLink", () => {
  it.effect("uses a generated code", () =>
    Effect.gen(function* () {
      const rec = yield* createLink({ url: "https://x.com" }).pipe(Effect.provide(provide(["AAAAAAA"])))
      expect(rec.shortCode).toBe("AAAAAAA")
      expect(rec.clicks).toBe(0)
    }),
  )

  it.effect("honours a custom code", () =>
    Effect.gen(function* () {
      const rec = yield* createLink({ url: "https://x.com", customCode: ShortCode.make("promo") }).pipe(
        Effect.provide(provide(["AAAAAAA"])),
      )
      expect(rec.shortCode).toBe("promo")
    }),
  )

  it.effect("a taken custom code fails with ShortCodeTaken", () =>
    Effect.gen(function* () {
      const exit = yield* createLink({ url: "https://x.com", customCode: ShortCode.make("promo") }).pipe(
        Effect.provide(
          provide(["AAAAAAA"], [{ shortCode: "promo", url: "https://y.com", createdAt: 1, clicks: 0 }]),
        ),
        Effect.exit,
      )
      expect(Exit.isFailure(exit)).toBe(true)
    }),
  )

  it.effect("retries past generated-code collisions", () =>
    Effect.gen(function* () {
      const seed = [
        { shortCode: "AAAAAAA", url: "https://a.com", createdAt: 1, clicks: 0 },
        { shortCode: "BBBBBBB", url: "https://b.com", createdAt: 1, clicks: 0 },
      ]
      const rec = yield* createLink({ url: "https://x.com" }).pipe(
        Effect.provide(provide(["AAAAAAA", "BBBBBBB", "CCCCCCC"], seed)),
      )
      expect(rec.shortCode).toBe("CCCCCCC")
    }),
  )

  it.effect("sets expiresAt when expiresIn is given", () =>
    Effect.gen(function* () {
      const rec = yield* createLink({ url: "https://x.com", expiresIn: 3600 }).pipe(
        Effect.provide(provide(["AAAAAAA"])),
      )
      expect(rec.expiresAt).toBeGreaterThanOrEqual(3600)
    }),
  )
})
