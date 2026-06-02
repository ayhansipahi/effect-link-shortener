import { Clock, Effect } from "effect"
import type { CreateLinkRequest, LinkRecord, ShortCode } from "../domain/schema"
import { StoreUnavailable } from "../domain/errors"
import { CodeGen } from "../services/CodeGen"
import { LinkStore } from "../services/LinkStore"

export const createLink = (request: CreateLinkRequest) =>
  Effect.gen(function* () {
    const codeGen = yield* CodeGen
    const store = yield* LinkStore
    const now = yield* Clock.currentTimeMillis
    const expiresAt =
      request.expiresIn === undefined ? undefined : Math.floor(now / 1000) + request.expiresIn

    const save = (shortCode: ShortCode) =>
      store.create({ shortCode, url: request.url, createdAt: now, expiresAt, clicks: 0 })

    if (request.customCode !== undefined) {
      return yield* save(request.customCode)
    }

    const saveWithGeneratedCode = (
      triesLeft: number,
    ): Effect.Effect<LinkRecord, StoreUnavailable, CodeGen | LinkStore> =>
      codeGen.generate.pipe(
        Effect.flatMap(save),
        Effect.catchTag("ShortCodeTaken", (collision) =>
          triesLeft > 1
            ? saveWithGeneratedCode(triesLeft - 1)
            : new StoreUnavailable({ cause: collision }),
        ),
      )

    return yield* saveWithGeneratedCode(5)
  })
