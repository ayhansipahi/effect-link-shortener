import { describe, expect, test } from "vitest"
import { Schema } from "effect"
import { CreateLinkRequest, LinkRecord, ShortCode, Url } from "../src/domain/schema"

describe("schema", () => {
  test("Url accepts http(s) and rejects others", () => {
    expect(Schema.decodeUnknownSync(Url)("https://example.com")).toBe("https://example.com")
    expect(() => Schema.decodeUnknownSync(Url)("ftp://example.com")).toThrow()
    expect(() => Schema.decodeUnknownSync(Url)("not-a-url")).toThrow()
  })

  test("ShortCode enforces the alphabet and length", () => {
    expect(Schema.decodeUnknownSync(ShortCode)("abc123")).toBe("abc123")
    expect(() => Schema.decodeUnknownSync(ShortCode)("no")).toThrow()
    expect(() => Schema.decodeUnknownSync(ShortCode)("has space")).toThrow()
  })

  test("CreateLinkRequest parses optional fields", () => {
    const r = Schema.decodeUnknownSync(CreateLinkRequest)({ url: "https://x.com", expiresIn: 60 })
    expect(r.url).toBe("https://x.com")
    expect(r.expiresIn).toBe(60)
    expect(r.customCode).toBeUndefined()
  })

  test("LinkRecord defaults clicks to 0", () => {
    const rec = Schema.decodeUnknownSync(LinkRecord)({
      shortCode: "abc123",
      url: "https://x.com",
      createdAt: 1,
    })
    expect(rec.clicks).toBe(0)
  })
})
