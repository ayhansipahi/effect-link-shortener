import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { DynamoDBDocument } from "@effect-aws/dynamodb"
import { makeLinkStoreLayer } from "./makeLinkStoreLayer"

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000"
const tableName = process.env.LINKS_TABLE ?? "Links"

const localDocumentLayer = DynamoDBDocument.baseLayer((_defaultConfig) =>
  DynamoDBDocumentClient.from(
    new DynamoDBClient({
      endpoint,
      region: "local",
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    }),
    { marshallOptions: { removeUndefinedValues: true } },
  ),
)

export const LinkStoreLocal = makeLinkStoreLayer(localDocumentLayer, tableName)
