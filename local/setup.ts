import {
  DynamoDBClient,
  CreateTableCommand,
  UpdateTimeToLiveCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb"

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000"
const TableName = process.env.LINKS_TABLE ?? "Links"
const client = new DynamoDBClient({
  endpoint,
  region: "local",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
})

async function main() {
  try {
    await client.send(
      new CreateTableCommand({
        TableName,
        AttributeDefinitions: [{ AttributeName: "shortCode", AttributeType: "S" }],
        KeySchema: [{ AttributeName: "shortCode", KeyType: "HASH" }],
        BillingMode: "PAY_PER_REQUEST",
      }),
    )
    console.warn(`created table ${TableName}`)
  } catch (e: unknown) {
    const err = e as { name?: string }
    if (err?.name === "ResourceInUseException") console.warn(`table ${TableName} already exists`)
    else throw e
  }
  await client.send(new DescribeTableCommand({ TableName }))
  try {
    await client.send(
      new UpdateTimeToLiveCommand({
        TableName,
        TimeToLiveSpecification: { Enabled: true, AttributeName: "expiresAt" },
      }),
    )
    console.warn(`TTL enabled on expiresAt`)
  } catch (e: unknown) {
    const err = e as { name?: string }
    console.warn(`TTL setup skipped: ${err?.name ?? e}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
