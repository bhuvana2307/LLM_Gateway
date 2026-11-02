import { describe, expect, it } from "vitest"
import { getProvider } from "../src/providers"

describe("provider routing", () => {
    it("routes a valid mock model to the mock provider", () => {
        const provider = getProvider("mock-small")

        expect(provider).toBeTruthy()
        expect(provider.name).toBe("mock")
    })

    it("returns null for an unsupported model", () => {
        expect(getProvider("openai-gpt-4o")).toBeNull()
    })

    it("returns null for empty or non-string model values", () => {
        expect(getProvider("")).toBeNull()
        expect(getProvider(null)).toBeNull()
        expect(getProvider(123)).toBeNull()
    })

    it("treats whitespace-only model strings as empty", () => {
        expect(getProvider("   ")).toBeNull()
    })
})
