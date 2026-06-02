import { Effect } from "effect"
import type { ShortCode } from "../domain/schema"
import { LinkStore } from "../services/LinkStore"
import { resolveLink } from "./resolveLink"

export const visit = (shortCode: ShortCode) =>
  Effect.gen(function* () {
    const store = yield* LinkStore
    const link = yield* resolveLink(shortCode)
    // The counter must never break the redirect: swallow store failures to `undefined`.
    const clicks = yield* store.incrementClicks(shortCode).pipe(
      Effect.catchAll(() => Effect.succeed(undefined)),
    )
    return { url: link.url, clicks }
  })
