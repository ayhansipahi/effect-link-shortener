import { Context, Effect } from "effect"
import type { LinkRecord, ShortCode } from "../domain/schema"
import type { ShortCodeNotFound, ShortCodeTaken, StoreUnavailable } from "../domain/errors"

export interface LinkStoreService {
  readonly create: (
    record: LinkRecord,
  ) => Effect.Effect<LinkRecord, ShortCodeTaken | StoreUnavailable>
  readonly get: (
    shortCode: ShortCode,
  ) => Effect.Effect<LinkRecord, ShortCodeNotFound | StoreUnavailable>
  readonly incrementClicks: (
    shortCode: ShortCode,
  ) => Effect.Effect<number, StoreUnavailable>
}

export class LinkStore extends Context.Tag("app/LinkStore")<
  LinkStore,
  LinkStoreService
>() {}
