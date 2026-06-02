import type { APIGatewayProxyEventV2 } from "aws-lambda"
import { runHandler } from "../lambda"
import { redirectProgram } from "../programs"

export const handler = (event: APIGatewayProxyEventV2) =>
  runHandler(redirectProgram(event.pathParameters?.code ?? ""))
