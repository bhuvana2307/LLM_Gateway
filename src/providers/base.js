class LLMProvider {
    constructor(name) {
        this.name = name
    }

    async chat() {
        throw new Error("Provider chat() is not implemented")
    }
}

module.exports = LLMProvider
