const express = require("express")
const config = require("./config")
const { requireApiKey } = require("./middleware/auth")
const { createRateLimiter } = require("./middleware/rateLimiter")
const { createChatRouter } = require("./routes/chat")

function createApp(overrides = {}) {
    const appConfig = { ...config, ...overrides }
    const app = express()

    app.use(express.json({ limit: "1mb" }))

    app.get("/health", (_req, res) => {
        res.json({ status: "ok" })
    })

    app.use(
        "/v1/chat",
        requireApiKey,
        createRateLimiter({
            maxRequests: appConfig.rateLimitMax,
            windowMs: appConfig.rateLimitWindowMs,
        }),
        createChatRouter(appConfig)
    )

    return app
}

module.exports = { createApp }
