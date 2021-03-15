/*

Should the lexer be able to know that it's inside an object?

I think it should, because this saves us a lot of trouble.

*/

const START_STATE = 0
const INTEGER_STATE = 1
const FLOAT_STATE = 2
const UNQUOTED_STRING_STATE = 3
const COMMENT_STATE = 4
const QUOTED_STRING_STATE = 5

const NUMBER = Symbol.for("NUMBER")
const STRING = Symbol.for("STRING")
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

const ALLOWED_PUNCTUATION = "()[]{},:$=;@."
const UNQUOTED_STRING_TERMINATORS = ":,()[]{}.;\n\r#$=\0@"
const UNQUOTED_STRING_TERMINATORS_WITH_SPACE = UNQUOTED_STRING_TERMINATORS + " \t"
const WHITESPACE = " \r\t\n"

const Kind = {
    NUMBER,
    STRING,
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

function* getTokens(text) {
    let state = START_STATE

    const it = text[Symbol.iterator]()
    let itResponse = it.next()

    let currToken = ""
    let advance = false
    let endCharRead = false
    let stringTerm
    let allowSpaceInUnquotedString = false

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
        } else if (itResponse.done) {
            endCharRead = true
            continue
        }

        const char = itResponse.value || '\0'

        switch (state) {
            case START_STATE: {
                if (char === '-' || (char >= '0' && char <= '9')) {
                    currToken += char
                    state = INTEGER_STATE
                    advance = true
                } else if (ALLOWED_PUNCTUATION.includes(char)) {
                    advance = true

                    yield { kind: Symbol.for(char), text: char, value: char }

                    // Special cases; after a variable or tag name, we don't allow spaces
                    // on unquoted strings.
                    if (char === '$' || char === '@') {
                        allowSpaceInUnquotedString = false
                    }
                } else if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === "_") {
                    currToken += char
                    state = UNQUOTED_STRING_STATE
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
                } else {
                    if (char === '\0') {
                        continue
                    } else {
                        throw new Error("DARN")
                    }
                }
                break
            }
            
            case INTEGER_STATE: {
                if (char < '0' || char > '9') {
                    yield { kind: NUMBER, text: currToken, value: parseInt(currToken) }
                    currToken = ""
                    state = START_STATE
                } else if (char === '.') {
                    currToken += '.'
                    state = FLOAT_STATE
                    advance = true
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case FLOAT_STATE: {
                if (char < '0' || char > '9') {
                    yield { kind: NUMBER, text: currToken, value: parseFloat(currToken) }
                    currToken = ""
                    state = START_STATE
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case UNQUOTED_STRING_STATE: {
                const terminators = allowSpaceInUnquotedString
                    ? UNQUOTED_STRING_TERMINATORS
                    : UNQUOTED_STRING_TERMINATORS_WITH_SPACE

                if (terminators.includes(char)) {
                    // Unquoted strings must be trimmed. If leading/trailing spaces are 
                    // necessary, use quotes.
                    yield { kind: STRING, text: currToken.trim(), value: currToken.trim() }
                    currToken = ""
                    state = START_STATE
                    allowSpaceInUnquotedString = false
                } else {
                    currToken += char
                    advance = true
                }
                break
            }

            case QUOTED_STRING_STATE: {
                if (char === stringTerm) {
                    yield { kind: STRING, text: `${stringTerm}${currToken}${stringTerm}`, value: currToken }
                    advance = true
                    currToken = ""
                    state = START_STATE
                } else {
                    currToken += char
                    advance = true
                }
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

    yield { kind: EOF, value: "EOF", text: "EOF" }
}

module.exports = {
    getTokens,
    Kind
}
