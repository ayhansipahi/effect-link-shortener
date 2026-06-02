import { describe, expect, test } from "vitest"
import { Effect, Exit, Layer } from "effect"
import { ShortCode } from "../src/domain/schema"
import { createLink } from "../src/core/createLink"
import { InMemoryLinkStore, QueueCodeGen } from "./support/inMemory"

const provide = (codes: string[], seed = [] as any[]) =>
  Layer.merge(InMemoryLinkStore({ seed }), QueueCodeGen(codes))

describe("createLink", () => {
  test("uses a generated code", async () => {
    const rec = await Effect.runPromise(
      createLink({ url: "https://x.com" }).pipe(Effect.provide(provide(["AAAAAAA"]))),
    )
    expect(rec.shortCode).toBe("AAAAAAA")
    expect(rec.clicks).toBe(0)
  })

  test("honours a custom code", async () => {
    const rec = await Effect.runPromise(
      createLink({ url: "https://x.com", customCode: ShortCode.make("promo") }).pipe(
        Effect.provide(provide(["AAAAAAA"])),
      ),
    )
    expect(rec.shortCode).toBe("promo")
  })

  test("a taken custom code fails with ShortCodeTaken", async () => {
    const exit = await Effect.runPromiseExit(
      createLink({ url: "https://x.com", customCode: ShortCode.make("promo") }).pipe(
        Effect.provide(
          provide(["AAAAAAA"], [{ shortCode: "promo", url: "https://y.com", createdAt: 1, clicks: 0 }]),
        ),
      ),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  test("retries past generated-code collisions", async () => {
    const seed = [
      { shortCode: "AAAAAAA", url: "https://a.com", createdAt: 1, clicks: 0 },
      { shortCode: "BBBBBBB", url: "https://b.com", createdAt: 1, clicks: 0 },
    ]
    const rec = await Effect.runPromise(
      createLink({ url: "https://x.com" }).pipe(
        Effect.provide(provide(["AAAAAAA", "BBBBBBB", "CCCCCCC"], seed)),
      ),
    )
    expect(rec.shortCode).toBe("CCCCCCC")
  })

  test("sets expiresAt when expiresIn is given", async () => {
    const rec = await Effect.runPromise(
      createLink({ url: "https://x.com", expiresIn: 3600 }).pipe(Effect.provide(provide(["AAAAAAA"]))),
    )
    expect(rec.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
})
