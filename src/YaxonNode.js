class YaxonNode {
    constructor(fields) {
        for (const [key, value] of Object.entries(fields)) {
            this[key] = value
        }
    }
}

module.exports = YaxonNode