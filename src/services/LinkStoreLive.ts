import { Effect, Layer, Option, Schema } from "effect"
import { DynamoDBDocument } from "@effect-aws/dynamodb"
import { Resource } from "sst"
import { LinkRecord, type ShortCode } from "../domain/schema"
import { ShortCodeNotFound, ShortCodeTaken, StoreUnavailable } from "../domain/errors"
import { LinkStore } from "./LinkStore"

const encodeRecord = Schema.encodeUnknownSync(LinkRecord)
const decodeRecord = Schema.decodeUnknown(LinkRecord)

export const LinkStoreLive = Layer.effect(
  LinkStore,
  Effect.gen(function* () {
    const doc = yield* DynamoDBDocument
    const TableName = Resource.Links.name

    const create = (record: LinkRecord): Effect.Effect<LinkRecord, ShortCodeTaken | StoreUnavailable> =>
      doc
        .put({
          TableName,
          Item: encodeRecord(record),
          ConditionExpression: "attribute_not_exists(shortCode)",
        })
        .pipe(
          Effect.as(record),
          Effect.catchAll(
            (e): Effect.Effect<never, ShortCodeTaken | StoreUnavailable> =>
              e._tag === "ConditionalCheckFailedException"
                ? Effect.fail(new ShortCodeTaken({ shortCode: record.shortCode }))
                : Effect.fail(new StoreUnavailable({ cause: e })),
          ),
        )

    const get = (shortCode: ShortCode): Effect.Effect<LinkRecord, ShortCodeNotFound | StoreUnavailable> =>
      doc.get({ TableName, Key: { shortCode } }).pipe(
        Effect.mapError((e) => new StoreUnavailable({ cause: e })),
        Effect.flatMap((res): Effect.Effect<LinkRecord, ShortCodeNotFound | StoreUnavailable> =>
          res.Item
            ? decodeRecord(res.Item).pipe(
                Effect.mapError((e) => new StoreUnavailable({ cause: e })),
              )
            : Effect.fail(new ShortCodeNotFound({ shortCode })),
        ),
      )

    const incrementClicks = (shortCode: ShortCode): Effect.Effect<number, StoreUnavailable> =>
      doc
        .update({
          TableName,
          Key: { shortCode },
          UpdateExpression: "ADD clicks :one",
          ExpressionAttributeValues: { ":one": 1 },
          ReturnValues: "UPDATED_NEW",
        })
        .pipe(
          Effect.map((res) => Number(res.Attributes?.clicks ?? 0)),
          Effect.mapError((e) => new StoreUnavailable({ cause: e })),
        )

    return { create, get, incrementClicks }
  }),
).pipe(
  Layer.provide(DynamoDBDocument.layer({ marshallOptions: { removeUndefinedValues: true } })),
)
