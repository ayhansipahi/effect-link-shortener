import { Effect, Schema } from "effect"
import { createLink } from "./core/createLink"
import { visit } from "./core/visit"
import { decodeBody, json, redirect } from "./http"
import { presentCreated } from "./domain/present"
import { ShortCode } from "./domain/schema"
import { ShortCodeNotFound } from "./domain/errors"

export const createProgram = (body: string | null | undefined, baseUrl: string) =>
  decodeBody(body).pipe(
    Effect.flatMap(createLink),
    Effect.map((record) => json(201, presentCreated(record, baseUrl))),
  )

export const redirectProgram = (rawCode: string) =>
  Effect.gen(function* () {
    const code = yield* Schema.decodeUnknown(ShortCode)(rawCode).pipe(
      Effect.catchTag("ParseError", () => new ShortCodeNotFound({ shortCode: rawCode })),
    )
    const { url, clicks } = yield* visit(code)
    return redirect(url, clicks)
  })
