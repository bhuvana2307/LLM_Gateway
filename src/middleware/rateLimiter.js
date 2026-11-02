function createRateLimiter({ maxRequests, windowMs }) {
    const clients = new Map()

    return (req, res, next) => {
        const key = req.apiKey
        const now = Date.now()

        let client = clients.get(key)

        if (!client || now - client.windowStart >= windowMs) {
            client = {
                windowStart: now,
                count: 0,
            }
            clients.set(key, client)
        }

        client.count += 1

        if (client.count > maxRequests) {
            const elapsed = now - client.windowStart
            const remainingMs = Math.max(0, windowMs - elapsed)
            const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000))

            res.setHeader("Retry-After", String(retryAfterSeconds))

            return res.status(429).json({
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                    message: `Rate limit exceeded. Retry after ${retryAfterSeconds} second(s).`,
                },
            })
        }

        next()
    }
}

module.exports = { createRateLimiter }
