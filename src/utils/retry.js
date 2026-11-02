const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504])

function isTransientError(error) {
    return Boolean(error && TRANSIENT_STATUS_CODES.has(error.statusCode))
}

async function withRetry(operation, { maxAttempts, shouldRetry, sleep }) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
        throw new Error("maxAttempts must be a positive integer")
    }

    let attempt = 1
    let lastError

    while (attempt <= maxAttempts) {
        try {
            return await operation(attempt)
        } catch (error) {
            lastError = error

            const shouldRetryAttempt = attempt < maxAttempts && shouldRetry(error)

            if (!shouldRetryAttempt) {
                throw error
            }

            const backoffMs = 100 * 2 ** (attempt - 1)
            await sleep(backoffMs)
            attempt += 1
        }
    }

    throw lastError
}

module.exports = { isTransientError, withRetry }
