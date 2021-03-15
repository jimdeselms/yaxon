const SPECIAL_STRINGS = ["null", "true", "false"]
const UNQUOTED_STRING_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/

function stringify(obj) {
    if (obj === null) { return "null" }

    if (typeof(obj) === "boolean") {
        return obj ? "true" : "false"
    }

    if (typeof(obj) === "string") {
        if (stringShouldBeQuoted(obj)) {
            return '"' + obj + '"'
        } else {
            return obj
        }
    }

    if (typeof(obj) === "number") {
        return obj.toString()
    }

    if (typeof(obj) === "object") {
        if (Array.isArray(obj)) {
            return stringifyArray(obj)
        } else {
            return stringifyObject(obj)
        }
    }
}

function stringifyArray(arr) {
    const parts = arr.map(el => stringify(el))

    return "[" + parts.join(' ') + "]"
}

function stringifyObject(obj) {
    const parts = Object.entries(obj).map(([key, value]) => {
        const serKey = stringify(key)
        const serVal = stringify(value)
        return serKey + ":" + serVal
    })

    return "{" + parts.join(" ") + "}"
}

function stringShouldBeQuoted(str) {
    return SPECIAL_STRINGS.includes(str) || !str.match(UNQUOTED_STRING_REGEX) || parseFloat(str)
}

module.exports = {
    stringify
}