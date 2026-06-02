import { Effect, Layer, ManagedRuntime } from "effect"
import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda"
import type { AppError } from "./domain/errors"
import { withErrorMapping } from "./http"
import { CodeGen } from "./services/CodeGen"
import { LinkStore } from "./services/LinkStore"
import { LinkStoreLive } from "./services/LinkStoreLive"

const MainLayer = Layer.mergeAll(CodeGen.Default, LinkStoreLive)

export const runtime = ManagedRuntime.make(MainLayer)

export const runHandler = (
  program: Effect.Effect<APIGatewayProxyStructuredResultV2, AppError, LinkStore | CodeGen>,
): Promise<APIGatewayProxyStructuredResultV2> => runtime.runPromise(withErrorMapping(program))
