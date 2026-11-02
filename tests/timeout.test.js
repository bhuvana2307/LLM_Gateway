const { describe, expect, it, vi, beforeEach, afterEach } = await import("vitest")
const providers = require("../src/providers")
const { callLLM } = require("../src/services/llmService")

describe("llm timeout behavior", () => {
    beforeEach(() => {
        vi.useRealTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it("rejects when the provider exceeds the configured timeout", async () => {
        providers.getProvider = vi.fn(() => ({
            name: "mock",
            chat: async () => {
                await new Promise((resolve) => setTimeout(resolve, 200))
                return { model: "mock-small" }
            },
        }))

        await expect(
            callLLM({
                model: "mock-small",
                messages: [{ role: "user", content: "hello" }],
                timeoutMs: 50,
                maxRetries: 0,
            })
        ).rejects.toMatchObject({
            code: "PROVIDER_TIMEOUT",
            statusCode: 504,
        })
    })

    it("uses the default timeout when no timeout is provided", async () => {
        vi.useFakeTimers()

        providers.getProvider = vi.fn(() => ({
            name: "mock",
            chat: async () => {
                await new Promise((resolve) => setTimeout(resolve, 6000))
                return { model: "mock-small" }
            },
        }))

        const pending = callLLM({
            model: "mock-small",
            messages: [{ role: "user", content: "hello" }],
            maxRetries: 0,
        })

        pending.catch(() => {})

        await vi.advanceTimersByTimeAsync(5000)

        await expect(pending).rejects.toMatchObject({
            code: "PROVIDER_TIMEOUT",
            statusCode: 504,
        })
    })

    it("returns successfully when the provider responds before the timeout", async () => {
        providers.getProvider = vi.fn(() => ({
            name: "mock",
            chat: async ({ model, messages }) => ({
                model,
                message: { role: "assistant", content: `Response to: ${messages[0].content}` },
                usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
            }),
        }))

        const result = await callLLM({
            model: "mock-small",
            messages: [{ role: "user", content: "hello" }],
            timeoutMs: 200,
            maxRetries: 0,
        })

        expect(result.model).toBe("mock-small")
        expect(result.message.role).toBe("assistant")
    })
})
