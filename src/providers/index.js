const MockLLMProvider = require("./mockProvider")

const providers = {
    mock: new MockLLMProvider(),
}

function getProvider(model) {
    if (!model || typeof model !== "string") {
        return null
    }

    const normalizedModel = model.trim()

    if (!normalizedModel) {
        return null
    }

    if (normalizedModel.startsWith("mock-")) {
        return providers.mock
    }

    return null
}

module.exports = { getProvider }
