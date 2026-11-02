const express = require("express")
const { validateChatRequest } = require("../validation/chatRequest")
const { callLLM } = require("../services/llmService")
const { requestId } = require("../utils/requestId")

function createChatRouter(config) {
    const router = express.Router()

    router.post("/completions", async (req, res) => {
        const id = requestId()
        const startedAt = Date.now()

        const validation = validateChatRequest(req.body)

        if (!validation.success) {
            return res.status(400).json({
                error: {
                    code: "INVALID_REQUEST",
                    message: validation.error.issues
                        .map((issue) => issue.message)
                        .join(", "),
                },
            })
        }

        try {
            const result = await callLLM({
                ...validation.data,
                timeoutMs: config.llmTimeoutMs,
                maxRetries: config.maxRetries,
            })

            const latencyMs = Date.now() - startedAt

            console.log(JSON.stringify({
                requestId: id,
                model: result.model,
                apiKeyId: req.apiKeyId,
                latencyMs,
                usage: result.usage,
                outcome: "success",
            }))

            return res.json({
                id,
                model: result.model,
                message: result.message,
                usage: result.usage,
                latencyMs,
            })
        } catch (error) {
            const latencyMs = Date.now() - startedAt

            console.error(JSON.stringify({
                requestId: id,
                model: validation.data.model,
                apiKeyId: req.apiKeyId,
                latencyMs,
                outcome: "error",
                code: error.code,
            }))

            const status = error.statusCode || 500

            return res.status(status).json({
                error: {
                    code: error.code || "INTERNAL_ERROR",
                    message: error.publicMessage || error.message || "Internal server error",
                },
            })
        }
    })

    return router
}

module.exports = { createChatRouter }
