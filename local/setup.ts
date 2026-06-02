import {
  DynamoDBClient,
  CreateTableCommand,
  UpdateTimeToLiveCommand,
  DescribeTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb"

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000"
const TableName = process.env.LINKS_TABLE ?? "Links"
const client = new DynamoDBClient({
  endpoint,
  region: "local",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// `docker compose up -d` returns before DynamoDB Local's server is actually
// accepting requests (its port is forwarded before the Java app is ready), so
// poll until it responds before doing anything else.
async function waitForReady(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      await client.send(new ListTablesCommand({}))
      return
    } catch (error) {
      lastError = error
      await sleep(500)
    }
  }
  throw lastError
}

async function main() {
  console.warn(`waiting for DynamoDB Local at ${endpoint} ...`)
  await waitForReady()

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
