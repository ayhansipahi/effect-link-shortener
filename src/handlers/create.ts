import { Effect } from "effect"
import type { APIGatewayProxyEventV2 } from "aws-lambda"
import { decodeBody, json } from "../http"
import { runHandler } from "../runtime"
import { createLink } from "../core/createLink"
import { presentCreated } from "../domain/present"

export const handler = (event: APIGatewayProxyEventV2) =>
  runHandler(
    decodeBody(event).pipe(
      Effect.flatMap(createLink),
      Effect.map((record) =>
        json(201, presentCreated(record, `https://${event.requestContext.domainName}`)),
      ),
    ),
  )
