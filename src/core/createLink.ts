import { Clock, Effect } from "effect"
import type { CreateLinkRequest, LinkRecord, ShortCode } from "../domain/schema"
import { StoreUnavailable } from "../domain/errors"
import { CodeGen } from "../services/CodeGen"
import { LinkStore } from "../services/LinkStore"

export const createLink = (request: CreateLinkRequest): Effect.Effect<
  LinkRecord,
  StoreUnavailable | import("../domain/errors").ShortCodeTaken,
  CodeGen | LinkStore
> =>
  Effect.gen(function* () {
    const codeGen = yield* CodeGen
    const store = yield* LinkStore
    const now = yield* Clock.currentTimeMillis
    const expiresAt =
      request.expiresIn !== undefined
        ? Math.floor(now / 1000) + request.expiresIn
        : undefined

    const persist = (shortCode: ShortCode) =>
      store.create({ shortCode, url: request.url, createdAt: now, expiresAt, clicks: 0 })

    if (request.customCode !== undefined) {
      // A clash on an explicit code is a real 409 — no retry.
      return yield* persist(request.customCode)
    }

    // A clash on a generated code just means "try another one".
    const attempt = Effect.gen(function* () {
      const code = yield* codeGen.generate
      return yield* persist(code)
    })

    return yield* attempt.pipe(
      // Retry up to 5 times, but STOP retrying if the error is NOT ShortCodeTaken.
      Effect.retry({ times: 5, until: (e) => e._tag !== "ShortCodeTaken" }),
      // Exhausted the retries: out of codes, treat as a store problem (500), not 409.
      Effect.catchTag("ShortCodeTaken", (e) => new StoreUnavailable({ cause: e })),
    )
  })
