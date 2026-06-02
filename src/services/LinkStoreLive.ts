import { DynamoDBDocument } from "@effect-aws/dynamodb"
import { Resource } from "sst"
import { makeLinkStoreLayer } from "./makeLinkStoreLayer"

export const LinkStoreLive = makeLinkStoreLayer(
  DynamoDBDocument.layer({ marshallOptions: { removeUndefinedValues: true } }),
  Resource.Links.name,
)
