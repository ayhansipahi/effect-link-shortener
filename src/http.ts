import { Effect, ParseResult, Schema } from "effect"
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda"
import { CreateLinkRequest } from "./domain/schema"
import { InvalidRequest } from "./domain/errors"

export const json = (
  statusCode: number,
  body: unknown,
): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
})

export const redirect = (
  location: string,
  clicks: number | undefined,
): APIGatewayProxyStructuredResultV2 => ({
  statusCode: 301,
  headers: {
    Location: location,
    "Cache-Control": "public, max-age=300",
    ...(clicks !== undefined ? { "X-Click-Count": String(clicks) } : {}),
  },
})

export const decodeBody = (event: APIGatewayProxyEventV2) =>
  Effect.try({
    try: () => (event.body ? JSON.parse(event.body) : {}),
    catch: () => new InvalidRequest({ issues: "request body is not valid JSON" }),
  }).pipe(
    Effect.flatMap((raw) => Schema.decodeUnknown(CreateLinkRequest)(raw)),
    Effect.catchTag(
      "ParseError",
      (error) =>
        new InvalidRequest({ issues: ParseResult.ArrayFormatter.formatErrorSync(error) }),
    ),
  )
