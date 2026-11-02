const dotenv = require("dotenv")

dotenv.config()

module.exports = {
    port: Number(process.env.PORT || 3000),
    llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS || 5000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 5),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    maxRetries: Number(process.env.MAX_RETRIES || 3),
}
