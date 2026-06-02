/// <reference path="./sst-env.d.ts" />

export default $config({
  app(input) {
    return {
      name: "effect-link-shortener",
      home: "aws",
      removal: input?.stage === "production" ? "retain" : "remove",
    }
  },
  async run() {
    const table = new sst.aws.Dynamo("Links", {
      fields: { shortCode: "string" },
      primaryIndex: { hashKey: "shortCode" },
      ttl: "expiresAt",
    })

    const api = new sst.aws.ApiGatewayV2("Api")
    api.route("POST /links", { handler: "src/handlers/create.handler", link: [table] })
    api.route("GET /{code}", { handler: "src/handlers/redirect.handler", link: [table] })

    return { api: api.url }
  },
})
