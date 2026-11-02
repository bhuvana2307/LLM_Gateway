import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../src/app"

const payload = {
    model: "mock-small",
    messages: [{ role: "user", content: "What is RAG?" }],
}

describe("POST /v1/chat/completions", () => {
    it("requires an API key", async () => {
        const response = await request(createApp())
            .post("/v1/chat/completions")
            .send(payload)

        expect(response.status).toBe(401)
    })

    it("validates the request body", async () => {
        const response = await request(createApp())
            .post("/v1/chat/completions")
            .set("x-api-key", "test-key")
            .send({ model: "mock-small", messages: [] })

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe("INVALID_REQUEST")
    })

    it("supports the mock provider", async () => {
        const response = await request(createApp())
            .post("/v1/chat/completions")
            .set("x-api-key", "test-key")
            .send(payload)

        expect(response.status).toBe(200)
        expect(response.body.model).toBe("mock-small")
        expect(response.body.message.role).toBe("assistant")
        expect(response.body.usage.totalTokens).toBeGreaterThan(0)
        expect(response.body.latencyMs).toEqual(expect.any(Number))
    })
})
