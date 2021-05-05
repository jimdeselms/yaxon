const START_STATE = 0
const INTEGER_STATE = 1
const FLOAT_STATE = 2
const EXPONENT_STATE = 3
const EXPONENT_VALUE_STATE = 4
const BIGINT_STATE = 5
const UNQUOTED_STRING_STATE = 6
const COMMENT_STATE = 7
const QUOTED_STRING_STATE = 8
const MULTILINE_STRING_STATE = 9
const ESCAPED_CHAR_STATE = 10
const ESCAPED_HEX_CHAR_STATE = 11

const NUMBER = Symbol.for("NUMBER")
const STRING = Symbol.for("STRING")
const BIGINT = Symbol.for("BIGINT")
const LEFT_PAREN = Symbol.for("(")
const RIGHT_PAREN = Symbol.for(")")
const LEFT_BRACE = Symbol.for("{")
const RIGHT_BRACE = Symbol.for("}")
const LEFT_BRACKET = Symbol.for("[")
const RIGHT_BRACKET = Symbol.for("]")
const COLON = Symbol.for(":")
const DOLLAR = Symbol.for("$")
const EQUALS = Symbol.for("=")
const SEMICOLON = Symbol.for(";")
const AT_SIGN = Symbol.for("@")
const DOT = Symbol.for(".")
const EOF = Symbol.for("EOF")

const ALLOWED_PUNCTUATION = "()[]{}:$=;@."
const COMMON_TERMINATORS = "`()[]{}$=;@.#$=@,\n\r\0"
const UNQUOTED_MULTI_WORD_STRING_TERMINATORS = COMMON_TERMINATORS + ":"
const UNQUOTED_SINGLE_WORD_STRING_TERMINATORS = COMMON_TERMINATORS + " \t"
const WHITESPACE = " \r\t\n,"

const { YaxonError } = require('./YaxonError')

const Kind = {
    NUMBER,
    STRING,
    BIGINT,
    LEFT_PAREN,
    RIGHT_PAREN,
    LEFT_BRACE,
    RIGHT_BRACE,
    LEFT_BRACKET,
    RIGHT_BRACKET,
    COLON,
    DOLLAR,
    EQUALS,
    SEMICOLON,
    AT_SIGN,
    DOT,
    EOF
}

function* getTokens(text, source=undefined) {
    let state = START_STATE

    const it = text[Symbol.iterator]()
    let itResponse = it.next()

    let currToken = ""
    let advance = false
    let endCharRead = false
    let stringTerm
    let allowSpaceInUnquotedString = true
    let stateAfterEscape
    let hexCharCount = 0

    let currLine = 1
    let currColumn = 1
    let startLine = 1
    let startColumn = 1

    while (!endCharRead) {
        if (advance) {
            advance = false
            if (itResponse.done) {
                if (endCharRead) {
                    itResponse = { done: true }
                } else {
                    endCharRead = true
                    itResponse = { done: false, value: '\0' }
                }
            } else {
                itResponse = it.next()
            }

            if (itResponse.value === '\n') {
                currLine += 1
                currColumn = 0
            } else {
                currColumn += 1
            }
        } else if (itResponse.done) {
            endCharRead = true
            continue
        }

        const char = itResponse.value || '\0'

        switch (state) {
            case START_STATE: {
                startLine = currLine; startColumn = currColumn

                if (char === '-' || char === '+' || (char >= '0' && char <= '9')) {
                    currToken += char
                    state = INTEGER_STATE
                    advance = true
                } else if (ALLOWED_PUNCTUATION.includes(char)) {
                    advance = true

                    yield { kind: Symbol.for(char), text: char, value: char, line: startLine, column: startColumn, source }

                    // Special cases; after a variable or tag name, we don't allow spaces
                    // on unquoted strings.
                    if (char === '$' || char === '@') {
                        allowSpaceInUnquotedString = false
                    }
                } else if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === "_") {
                    currToken += char
                    state = UNQUOTED_STRING_STATE
                    advance = true
                } else if (char === '\\') {
                    currToken += char
                    state = 
                    advance = true
                } else if (char === '"' || char === "'") {
                    state = QUOTED_STRING_STATE
                    stringTerm = char
                    advance = true
                } else if (char === '#') {
                    state = COMMENT_STATE
                    advance = true
                } else if (WHITESPACE.includes(char)) {
                    advance = true
                } else if (char === '`') {
                    state = MULTILINE_STRING_STATE
                    advance = true
                } else {
                    if (char === '\0') {
                        continue
                    } else {
                        throw new YaxonError(`Unexpected character '${char}'`, currLine, currColumn, source)
                    }
                }
                break
            }
            
            case INTEGER_STATE: {
                if (char === 'n') {
                    state = BIGINT_STATE
                    advance = true
                } else if (char === '.') {
                    currToken += '.'
                    state = FLOAT_STATE
                    advance = true
                } else if (char === 'e' || char === 'E') {
                    currToken += char
                    state = EXPONENT_STATE
                    advance = true
                } else if (char !== 'e' && char !== 'E' && (char < '0' || char > '9')) {
                    yield { kind: NUMBER, text: currToken, value: parseInt(currToken), line: startLine, column: startColumn, source }
                    currToken = ""
                    state = START_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case FLOAT_STATE: {
                if (char === 'e' || char === 'E') {
                    currToken += char
                    state = EXPONENT_STATE
                    advance = true
                } else if (char < '0' || char > '9') {
                    yield { kind: NUMBER, text: currToken, value: parseFloat(currToken), line: startLine, column: startColumn, source }
                    currToken = ""
                    state = START_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case EXPONENT_STATE: {
                if (char !== '-' && char !== '+' && (char < '0' || char > '9')) {
                    yield { kind: NUMBER, text: currToken, value: parseFloat(currToken), line: startLine, column: startColumn, source }
                    currToken = ""
                    state = START_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case EXPONENT_VALUE_STATE: {
                if (char < '0' || char > '9') {
                    yield { kind: NUMBER, text: currToken, value: parseFloat(currToken), line: startLine, column: startColumn, source }
                    currToken = ""
                    state = START_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case BIGINT_STATE: {
                yield { kind: BIGINT, text: currToken + "n", value: BigInt(currToken), line: startLine, column: startColumn, source }
                currToken = ""
                state = START_STATE
                break
            }

            case UNQUOTED_STRING_STATE: {
                const terminators = allowSpaceInUnquotedString
                    ? UNQUOTED_MULTI_WORD_STRING_TERMINATORS
                    : UNQUOTED_SINGLE_WORD_STRING_TERMINATORS

                if (terminators.includes(char)) {
                    // Unquoted will must be trimmed. If leading/trailing spaces are 
                    // necessary, use quotes.
                    yield { kind: STRING, text: currToken.trim(), value: currToken.trim(), line: startLine, column: startColumn, source }
                    currToken = ""
                    state = START_STATE
                    allowSpaceInUnquotedString = true
                } else if (char === '\\') {
                    stateAfterEscape = UNQUOTED_STRING_STATE
                    advance = true
                    state = ESCAPED_CHAR_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case QUOTED_STRING_STATE: {
                if (char === stringTerm) {
                    yield { kind: STRING, text: `${stringTerm}${currToken}${stringTerm}`, value: currToken, line: startLine, column: startColumn, source }
                    advance = true
                    currToken = ""
                    state = START_STATE
                } else if (char === '\\') {
                    stateAfterEscape = QUOTED_STRING_STATE
                    advance = true
                    state = ESCAPED_CHAR_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case MULTILINE_STRING_STATE: {
                if (char === '`') {
                    yield { kind: STRING, text: '`' + currToken + '`', value: getMultilineText(currToken), line: startLine, column: startColumn, source }
                    advance = true
                    currToken = ""
                    state = START_STATE
                } else if (char === '\\') {
                    stateAfterEscape = MULTILINE_STRING_STATE
                    advance = true
                    state = ESCAPED_CHAR_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case ESCAPED_CHAR_STATE: {

                if (char === 'u') {
                    hexCharCount = 0
                    state = ESCAPED_HEX_CHAR_STATE
                    currToken += '\\'
                    advance = true
                    break
                }
                switch (char) {
                    case 'n': currToken += '\n'; break
                    case 't': currToken += '\t'; break
                    case 'b': currToken += '\b'; break
                    case 'r': currToken += '\n'; break
                    case 'f': currToken += '\f'; break
                    default: currToken += char; break
                }
                advance = true
                state = stateAfterEscape
                break
            }

            case ESCAPED_HEX_CHAR_STATE: {
                currToken += char
                advance = true
                if (++hexCharCount === 4) {
                    state = stateAfterEscape
                }
                break
            }

            case COMMENT_STATE: {
                if ("\r\n\0".includes(char)) {
                    state = START_STATE
                }
                advance = true
            }
        }

        if (state !== START_STATE && state !== UNQUOTED_STRING_STATE) {
            allowSpaceInUnquotedString = true
        }
    }

    yield { kind: EOF, value: "EOF", text: "EOF", line: currLine, column: currColumn, source }
}

function getMultilineText(text) {
    let lines = text.split('\n')

    // See the README.md for details on how multiline strings work
    // The first character tells us what mode we're in.
    let mode
    if (lines.length === 0) {
        return ""
    }

    if (lines[0].trim() === "") {
        mode = { trim: false, join: false, skipFirst: true }

    } else {
        mode = { trim: true, join: true, skipFirst: false }
    }

    if (mode.trim) {
        lines = lines.map(l => l.trim())
    }

    if (mode.join) {
        const joinedLines = []

        let currLine = ""
        let blankLine = true

        for (const line of lines) {
            if (line.length === 0) {
                joinedLines.push(currLine)
                currLine = ""
                blankLine = true
            } else {
                if (blankLine) {
                    blankLine = false
                    currLine += line
                } else {
                    currLine += " " + line
                }
            }
        }

        if (currLine.length > 0) {
            joinedLines.push(currLine)
        }

        lines = joinedLines
    }

    if (mode.skipFirst) {
        lines.splice(0, 1)
    }

    return lines.join('\n')
}

module.exports = {
    getTokens,
    Kind
}
