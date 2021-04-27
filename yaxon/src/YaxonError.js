class YaxonError extends Error {
    constructor(message, line, column, source) {
        super(getMessage(message, line, column, source))

        this.line = line
        this.column = column
        this.source = source
    }
}

function getMessage(message, line, column, source) {
    return source
        ? `${message} (${source}:${line}:${column})`
        : `${message} (${line}:${column})`
}

module.exports = {
    YaxonError
}