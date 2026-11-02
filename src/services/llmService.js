const providers = require("../providers")
const { withRetry, isTransientError } = require("../utils/retry")

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function createTimeoutError(timeoutMs) {
    const error = new Error(`LLM provider timed out after ${timeoutMs}ms`)
    error.code = "PROVIDER_TIMEOUT"
    error.statusCode = 504
    error.publicMessage = "LLM provider timed out"
    return error
}

async function callLLM({ model, messages, temperature, timeoutMs, maxRetries }) {
    const provider = providers.getProvider(model)

    if (!provider) {
        const error = new Error(`Unsupported model: ${model}`)
        error.code = "UNSUPPORTED_MODEL"
        error.statusCode = 400
        throw error
    }

    const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000
    const maxAttempts = Number.isInteger(maxRetries) && maxRetries > 0 ? maxRetries : 1
    const requestDeadlineMs = Date.now() + effectiveTimeoutMs

    const callAttempt = async () => {
        const remainingBudgetMs = requestDeadlineMs - Date.now()

        if (remainingBudgetMs <= 0) {
            throw createTimeoutError(effectiveTimeoutMs)
        }

        const attemptTimeoutMs = Math.min(effectiveTimeoutMs, remainingBudgetMs)
        let timedOut = false
        let timeoutHandle = null
        const abortController = typeof AbortController !== "undefined" ? new AbortController() : null

        const providerPromise = Promise.resolve()
            .then(() => provider.chat({
                model,
                messages,
                temperature,
                ...(abortController ? { signal: abortController.signal } : {}),
            }))
            .then((result) => {
                if (timedOut) {
                    return undefined
                }

                return result
            })
            .catch((error) => {
                if (timedOut) {
                    return undefined
                }

                throw error
            })

        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                timedOut = true

                if (abortController) {
                    abortController.abort()
                }

                reject(createTimeoutError(attemptTimeoutMs))
            }, attemptTimeoutMs)
        })

        try {
            const result = await Promise.race([providerPromise, timeoutPromise])

            if (timedOut) {
                throw createTimeoutError(attemptTimeoutMs)
            }

            return result
        } finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle)
            }
        }
    }

    const shouldRetry = (error) => {
        if (!error) {
            return false
        }

        const remainingBudgetMs = requestDeadlineMs - Date.now()

        if (remainingBudgetMs <= 0) {
            return false
        }

        if (error.code === "PROVIDER_TIMEOUT") {
            return true
        }

        return isTransientError(error)
    }

    return withRetry(callAttempt, {
        maxAttempts,
        shouldRetry,
        sleep,
    })
}

module.exports = { callLLM }
