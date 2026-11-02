const { z } = require("zod")

const chatRequestSchema = z.object({
    model: z.string().min(1),
    messages: z.array(
        z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string().min(1),
        })
    ).min(1),
    temperature: z.number().min(0).max(2).optional(),
})

function validateChatRequest(payload) {
    return chatRequestSchema.safeParse(payload)
}

module.exports = { validateChatRequest }
