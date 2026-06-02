import { Effect, Layer, Schema } from "effect"
import { DynamoDBDocument, type DynamoDBDocumentService } from "@effect-aws/dynamodb"
import { LinkRecord, type ShortCode } from "../domain/schema"
import { ShortCodeNotFound, ShortCodeTaken, StoreUnavailable } from "../domain/errors"
import { LinkStore } from "./LinkStore"

const encodeRecord = Schema.encodeUnknownSync(LinkRecord)
const decodeRecord = Schema.decodeUnknown(LinkRecord)
const storeError = (cause: unknown) => new StoreUnavailable({ cause })

export const makeLinkStoreLayer = (
  documentLayer: Layer.Layer<DynamoDBDocumentService>,
  tableName: string,
): Layer.Layer<LinkStore> =>
  Layer.effect(
    LinkStore,
    Effect.gen(function* () {
      const doc = yield* DynamoDBDocument

      const create = (
        record: LinkRecord,
      ): Effect.Effect<LinkRecord, ShortCodeTaken | StoreUnavailable> =>
        doc
          .put({
            TableName: tableName,
            Item: encodeRecord(record),
            ConditionExpression: "attribute_not_exists(shortCode)",
          })
          .pipe(
            Effect.as(record),
            Effect.catchAll((e): Effect.Effect<never, ShortCodeTaken | StoreUnavailable> =>
              e._tag === "ConditionalCheckFailedException"
                ? Effect.fail(new ShortCodeTaken({ shortCode: record.shortCode }))
                : Effect.fail(storeError(e)),
            ),
          )

      const get = (
        shortCode: ShortCode,
      ): Effect.Effect<LinkRecord, ShortCodeNotFound | StoreUnavailable> =>
        doc.get({ TableName: tableName, Key: { shortCode } }).pipe(
          Effect.mapError(storeError),
          Effect.flatMap((res): Effect.Effect<LinkRecord, ShortCodeNotFound | StoreUnavailable> =>
            res.Item
              ? decodeRecord(res.Item).pipe(Effect.mapError(storeError))
              : Effect.fail(new ShortCodeNotFound({ shortCode })),
          ),
        )

      const incrementClicks = (shortCode: ShortCode): Effect.Effect<number, StoreUnavailable> =>
        doc
          .update({
            TableName: tableName,
            Key: { shortCode },
            ConditionExpression: "attribute_exists(shortCode)",
            UpdateExpression: "ADD clicks :one",
            ExpressionAttributeValues: { ":one": 1 },
            ReturnValues: "UPDATED_NEW",
          })
          .pipe(
            Effect.map((res) => Number(res.Attributes?.clicks ?? 0)),
            Effect.mapError(storeError),
          )

      return { create, get, incrementClicks }
    }),
  ).pipe(Layer.provide(documentLayer))
