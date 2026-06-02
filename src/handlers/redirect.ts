import { Effect, Schema } from "effect"
import type { APIGatewayProxyEventV2 } from "aws-lambda"
import { redirect } from "../http"
import { runHandler } from "../runtime"
import { ShortCode } from "../domain/schema"
import { ShortCodeNotFound } from "../domain/errors"
import { visit } from "../core/visit"

export const handler = (event: APIGatewayProxyEventV2) =>
  runHandler(
    Effect.gen(function* () {
      const raw = event.pathParameters?.code ?? ""
      const code = yield* Schema.decodeUnknown(ShortCode)(raw).pipe(
        Effect.catchTag("ParseError", () => new ShortCodeNotFound({ shortCode: raw })),
      )
      const { url, clicks } = yield* visit(code)
      return redirect(url, clicks)
    }),
  )
