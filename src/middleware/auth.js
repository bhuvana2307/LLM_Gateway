function requireApiKey(req, res, next) {
    const apiKey = req.header("x-api-key")

    if (!apiKey) {
        return res.status(401).json({
            error: {
                code: "MISSING_API_KEY",
                message: "x-api-key header is required",
            },
        })
    }

    // Keep the raw key out of downstream request logs.
    req.apiKey = apiKey
    req.apiKeyId = `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`

    next()
}

module.exports = { requireApiKey }
