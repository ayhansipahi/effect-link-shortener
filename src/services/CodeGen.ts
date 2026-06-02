import { Effect } from "effect"
import { customAlphabet } from "nanoid"
import { ShortCode } from "../domain/schema"

const nano = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  7,
)

export class CodeGen extends Effect.Service<CodeGen>()("app/CodeGen", {
  sync: () => ({
    generate: Effect.sync(() => ShortCode.make(nano())),
  }),
}) {}
