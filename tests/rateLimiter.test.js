import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../src/app"

const payload = {
    model: "mock-small",
    messages: [{ role: "user", content: "What is RAG?" }],
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

describe("rate limiter", () => {
    it("rejects a sixth request from the same API key", async () => {
        const app = createApp({
            rateLimitMax: 5,
            rateLimitWindowMs: 60000,
        })

        for (let i = 0; i < 5; i += 1) {
            const response = await request(app)
                .post("/v1/chat/completions")
                .set("x-api-key", "test-key")
                .send(payload)

            expect(response.status).toBe(200)
        }

        const response = await request(app)
            .post("/v1/chat/completions")
            .set("x-api-key", "test-key")
            .send(payload)

        expect(response.status).toBe(429)
        expect(response.body.error.code).toBe("RATE_LIMIT_EXCEEDED")
        expect(response.headers["retry-after"]).toBeDefined()
    })

    it("tracks limits separately for each API key", async () => {
        const app = createApp({
            rateLimitMax: 5,
            rateLimitWindowMs: 60000,
        })

        for (let i = 0; i < 5; i += 1) {
            const response = await request(app)
                .post("/v1/chat/completions")
                .set("x-api-key", "key-a")
                .send(payload)

            expect(response.status).toBe(200)
        }

        const response = await request(app)
            .post("/v1/chat/completions")
            .set("x-api-key", "key-b")
            .send(payload)

        expect(response.status).toBe(200)
    })

    it("resets the window after the configured time passes", async () => {
        const app = createApp({
            rateLimitMax: 5,
            rateLimitWindowMs: 80,
        })

        for (let i = 0; i < 5; i += 1) {
            const response = await request(app)
                .post("/v1/chat/completions")
                .set("x-api-key", "reset-key")
                .send(payload)

            expect(response.status).toBe(200)
        }

        await wait(120)

        const response = await request(app)
            .post("/v1/chat/completions")
            .set("x-api-key", "reset-key")
            .send(payload)

        expect(response.status).toBe(200)
    })
})
