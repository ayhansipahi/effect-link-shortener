import { Data } from "effect"

export class InvalidRequest extends Data.TaggedError("InvalidRequest")<{
  readonly issues: unknown
}> {}

export class ShortCodeTaken extends Data.TaggedError("ShortCodeTaken")<{
  readonly shortCode: string
}> {}

export class ShortCodeNotFound extends Data.TaggedError("ShortCodeNotFound")<{
  readonly shortCode: string
}> {}

export class LinkExpired extends Data.TaggedError("LinkExpired")<{
  readonly shortCode: string
}> {}

export class StoreUnavailable extends Data.TaggedError("StoreUnavailable")<{
  readonly cause: unknown
}> {}

export type AppError =
  | InvalidRequest
  | ShortCodeTaken
  | ShortCodeNotFound
  | LinkExpired
  | StoreUnavailable
