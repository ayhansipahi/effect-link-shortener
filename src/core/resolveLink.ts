import { Clock, Effect } from "effect"
import type { ShortCode } from "../domain/schema"
import { LinkExpired } from "../domain/errors"
import { LinkStore } from "../services/LinkStore"

export const resolveLink = (shortCode: ShortCode) =>
  Effect.gen(function* () {
    const store = yield* LinkStore
    const link = yield* store.get(shortCode)
    const nowSeconds = Math.floor((yield* Clock.currentTimeMillis) / 1000)
    if (link.expiresAt !== undefined && nowSeconds > link.expiresAt) {
      return yield* new LinkExpired({ shortCode })
    }
    return link
  })
