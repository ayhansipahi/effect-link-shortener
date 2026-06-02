import type { LinkRecord } from "./schema"

export const presentCreated = (record: LinkRecord, baseUrl: string) => ({
  shortCode: record.shortCode,
  shortUrl: `${baseUrl}/${record.shortCode}`,
  url: record.url,
  createdAt: record.createdAt,
  ...(record.expiresAt !== undefined ? { expiresAt: record.expiresAt } : {}),
})
