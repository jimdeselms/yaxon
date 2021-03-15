const SPECIAL_STRINGS = ["null", "true", "false"]
const UNQUOTED_STRING_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const MAX_INLINE_STRING = 10
const YaxonNode = require('./YaxonNode')

function stringify(obj) {
    const references = { next: 1, vars: new Map() }
    getReferences(obj, references)

    const seen = new Set()
    return stringifyImpl(obj, references, seen)
}

function getReferences(obj, references) {

    const type = getType(obj)

    if (type !== "object" && type !== "array" && !(type === "string" && obj.length > MAX_INLINE_STRING)) {
        return
    }

    // If the object isn't in the list of references, then it's the
    // first reference. We don't want to assign a variable if it's the 
    // first one.
    if (references.vars.get(obj) === null) {
        references.vars.set(obj, "$v" + references.next++)

        // No need to look for references a second time.
        return
    } else {
        references.vars.set(obj, null)
    }

    if (type === "array") {
        for (const el of obj) {
            getReferences(el, references)
        }
    } else {
        for (const el of Object.values(obj)) {
            getReferences(el, references)
        }
    }
}

function getType(obj) {
    const type = typeof obj

    switch (type) {
        case "object": {
            if (obj === null) {
                return "null"
            } else if (Array.isArray(obj)) {
                return "array"
            } else if (obj.__proto__ === YaxonNode.prototype) {
                return "yaxon"
            } else {
                return "object"
            }
        }
        default: return type
    }
}

function stringifyImpl(obj, references, seen) {
    let varName = references.vars.get(obj)
    if (varName) {
        if (seen.has(obj)) {
            return varName
        } else {
            seen.add(obj)
        }
    }

    let value
    const type = getType(obj)
    switch (type) {
        case "null": 
        case "undefined":
            value = "null"; 
            break
        case "number": 
            value = obj.toString()
            break
        case "string": 
            value = stringShouldBeQuoted(obj)
                ? '"' + obj + '"'
                : obj
            break
        case "object": 
            value = stringifyObject(obj, references, seen)
            break
        case "array":
            value = stringifyArray(obj, references, seen)
            break
        case "boolean":
            value = obj ? "true" : "false"
            break
        default:
            throw new Error("Unexpected type " + type)
    }

    return varName
        ? varName + "=" + value
        : value
}

function stringifyArray(arr, references, seen) {
    const parts = arr.map(el => stringifyImpl(el, references, seen))

    return "[" + parts.join(' ') + "]"
}

function stringifyObject(obj, references, seen) {
    const parts = Object.entries(obj).map(([key, value]) => {
        const serKey = stringifyImpl(key, references, seen)
        const serVal = stringifyImpl(value, references, seen)
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