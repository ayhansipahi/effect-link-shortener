import { Schema } from "effect"

export const ShortCode = Schema.String.pipe(
  Schema.pattern(/^[0-9A-Za-z_-]{4,32}$/),
  Schema.brand("ShortCode"),
)
export type ShortCode = typeof ShortCode.Type

export const Url = Schema.String.pipe(
  Schema.maxLength(2048),
  Schema.filter((s) => /^https?:\/\//.test(s) || "must be an http(s) URL"),
)

export const CreateLinkRequest = Schema.Struct({
  url: Url,
  customCode: Schema.optional(ShortCode),
  expiresIn: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
})
export type CreateLinkRequest = typeof CreateLinkRequest.Type

export const LinkRecord = Schema.Struct({
  shortCode: ShortCode,
  url: Url,
  createdAt: Schema.Number,
  expiresAt: Schema.optional(Schema.Number),
  clicks: Schema.optionalWith(Schema.Number, { default: () => 0 }),
})
export type LinkRecord = typeof LinkRecord.Type
