import { Effect } from "effect"
import type { ShortCode } from "../domain/schema"
import { LinkStore } from "../services/LinkStore"
import { resolveLink } from "./resolveLink"

export const visit = (shortCode: ShortCode) =>
  Effect.gen(function* () {
    const store = yield* LinkStore
    const link = yield* resolveLink(shortCode)
    const clicks = yield* store.incrementClicks(shortCode).pipe(Effect.orElseSucceed(() => undefined))
    return { url: link.url, clicks }
  })
