import { Effect, ParseResult, Schema } from "effect"
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda"
import { CreateLinkRequest } from "./domain/schema"
import { InvalidRequest, type AppError } from "./domain/errors"

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

export const withErrorMapping = <R>(
  program: Effect.Effect<APIGatewayProxyStructuredResultV2, AppError, R>,
): Effect.Effect<APIGatewayProxyStructuredResultV2, never, R> =>
  program.pipe(
    Effect.catchTags({
      InvalidRequest: (e) => Effect.succeed(json(400, { error: "InvalidRequest", issues: e.issues })),
      ShortCodeTaken: (e) => Effect.succeed(json(409, { error: "ShortCodeTaken", shortCode: e.shortCode })),
      ShortCodeNotFound: () => Effect.succeed(json(404, { error: "ShortCodeNotFound" })),
      LinkExpired: () => Effect.succeed(json(410, { error: "LinkExpired" })),
      StoreUnavailable: () => Effect.succeed(json(500, { error: "InternalError" })),
    }),
    Effect.catchAllDefect(() => Effect.succeed(json(500, { error: "InternalError" }))),
  )

export const decodeBody = (body: string | null | undefined) =>
  Effect.try({
    try: () => (body ? JSON.parse(body) : {}),
    catch: () => new InvalidRequest({ issues: "request body is not valid JSON" }),
  }).pipe(
    Effect.flatMap((raw) => Schema.decodeUnknown(CreateLinkRequest)(raw)),
    Effect.catchTag(
      "ParseError",
      (error) =>
        new InvalidRequest({ issues: ParseResult.ArrayFormatter.formatErrorSync(error) }),
    ),
  )
