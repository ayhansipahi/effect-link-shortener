import { expect, test } from "vitest"
import { Effect } from "effect"
import { CodeGen } from "../src/services/CodeGen"

test("CodeGen.generate returns a valid short code", async () => {
  const code = await Effect.runPromise(
    Effect.gen(function* () {
      const gen = yield* CodeGen
      return yield* gen.generate
    }).pipe(Effect.provide(CodeGen.Default)),
  )
  expect(code).toMatch(/^[0-9A-Za-z_-]{4,32}$/)
})
