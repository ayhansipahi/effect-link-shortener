import { Effect, Layer } from "effect"
import type { LinkRecord, ShortCode } from "../../src/domain/schema"
import { ShortCode as ShortCodeSchema } from "../../src/domain/schema"
import { ShortCodeNotFound, ShortCodeTaken, StoreUnavailable } from "../../src/domain/errors"
import { CodeGen } from "../../src/services/CodeGen"
import { LinkStore } from "../../src/services/LinkStore"

export const InMemoryLinkStore = (
  opts: { readonly failIncrement?: boolean; readonly seed?: ReadonlyArray<LinkRecord> } = {},
) =>
  Layer.succeed(LinkStore, {
    ...(() => {
      const map = new Map<string, LinkRecord>()
      for (const rec of opts.seed ?? []) map.set(rec.shortCode, rec)

      return {
        create: (record: LinkRecord) =>
          map.has(record.shortCode)
            ? Effect.fail(new ShortCodeTaken({ shortCode: record.shortCode }))
            : Effect.sync(() => {
                map.set(record.shortCode, record)
                return record
              }),
        get: (shortCode: ShortCode) => {
          const found = map.get(shortCode)
          return found
            ? Effect.succeed(found)
            : Effect.fail(new ShortCodeNotFound({ shortCode }))
        },
        incrementClicks: (shortCode: ShortCode) => {
          if (opts.failIncrement) return Effect.fail(new StoreUnavailable({ cause: "forced" }))
          const found = map.get(shortCode)
          if (!found) return Effect.fail(new StoreUnavailable({ cause: `unknown shortCode: ${shortCode}` }))
          return Effect.sync(() => {
            const next = (found.clicks ?? 0) + 1
            map.set(shortCode, { ...found, clicks: next })
            return next
          })
        },
      }
    })(),
  })

export const QueueCodeGen = (codes: ReadonlyArray<string>) => {
  let i = 0
  return Layer.succeed(CodeGen, {
    generate: Effect.sync(() => ShortCodeSchema.make(codes[i++ % codes.length])),
  } as InstanceType<typeof CodeGen>)
}
