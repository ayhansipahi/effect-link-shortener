import { it } from "@effect/vitest"
import { expect } from "vitest"
import { Effect } from "effect"
import { CodeGen } from "../src/services/CodeGen"

it.effect("CodeGen.generate returns a valid short code", () =>
  Effect.gen(function* () {
    const gen = yield* CodeGen
    const code = yield* gen.generate
    expect(code).toMatch(/^[0-9A-Za-z_-]{4,32}$/)
  }).pipe(Effect.provide(CodeGen.Default)),
)
