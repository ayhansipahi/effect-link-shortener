import type { APIGatewayProxyEventV2 } from "aws-lambda"
import { runHandler } from "../lambda"
import { createProgram } from "../programs"

export const handler = (event: APIGatewayProxyEventV2) =>
  runHandler(createProgram(event.body, `https://${event.requestContext.domainName}`))
