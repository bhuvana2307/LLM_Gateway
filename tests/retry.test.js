import { describe, expect, it, vi } from "vitest"
import { withRetry, isTransientError } from "../src/utils/retry"

describe("withRetry", () => {
    it("retries transient errors until success", async () => {
        const operation = vi.fn()
            .mockRejectedValueOnce({ statusCode: 500 })
            .mockResolvedValueOnce({ ok: true })

        const result = await withRetry(operation, {
            maxAttempts: 3,
            shouldRetry: isTransientError,
            sleep: vi.fn().mockResolvedValue(undefined),
        })

        expect(result).toEqual({ ok: true })
        expect(operation).toHaveBeenCalledTimes(2)
    })

    it("stops after max attempts", async () => {
        const error = { statusCode: 503, message: "service unavailable" }
        const operation = vi.fn().mockRejectedValue(error)

        await expect(
            withRetry(operation, {
                maxAttempts: 3,
                shouldRetry: isTransientError,
                sleep: vi.fn().mockResolvedValue(undefined),
            })
        ).rejects.toThrow()

        expect(operation).toHaveBeenCalledTimes(3)
    })

    it("does not retry non-transient errors", async () => {
        const operation = vi.fn().mockRejectedValue({ statusCode: 400 })

        await expect(
            withRetry(operation, {
                maxAttempts: 3,
                shouldRetry: isTransientError,
                sleep: vi.fn().mockResolvedValue(undefined),
            })
        ).rejects.toMatchObject({ statusCode: 400 })

        expect(operation).toHaveBeenCalledTimes(1)
    })

    it("uses exponential backoff", async () => {
        const sleep = vi.fn().mockResolvedValue(undefined)
        const operation = vi.fn()
            .mockRejectedValueOnce({ statusCode: 429 })
            .mockRejectedValueOnce({ statusCode: 429 })
            .mockRejectedValueOnce({ statusCode: 429 })
            .mockResolvedValueOnce({ ok: true })

        const result = await withRetry(operation, {
            maxAttempts: 4,
            shouldRetry: isTransientError,
            sleep,
        })

        expect(result).toEqual({ ok: true })
        expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([100, 200, 400])
    })
})
