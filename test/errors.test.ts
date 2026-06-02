import { expect, test } from "vitest"
import { ShortCodeNotFound, ShortCodeTaken } from "../src/domain/errors"

test("tagged errors carry their tag and payload", () => {
  const taken = new ShortCodeTaken({ shortCode: "abc123" })
  expect(taken._tag).toBe("ShortCodeTaken")
  expect(taken.shortCode).toBe("abc123")

  const missing = new ShortCodeNotFound({ shortCode: "zzz" })
  expect(missing._tag).toBe("ShortCodeNotFound")
})
