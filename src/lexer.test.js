const lexer = require('./lexer')

describe("lexer", () => {
    it("integer", () => {
        testTokens("3", { kind: lexer.Kind.INTEGER, value: 3, text: "3" })
        testTokens("5123", { kind: lexer.Kind.INTEGER, value: 5123, text: "5123" })
        testTokens("-5123", { kind: lexer.Kind.INTEGER, value: -5123, text: "-5123" })
    })

    it("unquoted string with spaces", () => {
        testTokens("ab", { kind: lexer.Kind.STRING, value: "ab" })
        testTokens("a-234b", { kind: lexer.Kind.STRING, value: "a-234b" })
        testTokens("this^one-is%really!wacky", { kind: lexer.Kind.STRING, value: "this^one-is%really!wacky" })
    })

    it("unquoted string without spaces", () => {
        testTokens("hi", 
            { kind: lexer.Kind.STRING, value: "hi" }
        )
    })

    it('escaped characters in strings', () => {
        testTokens("this is a \\(\\'string\\'\\)\\. Cool\\, eh\\?", { value: "this is a ('string'). Cool, eh?" })
        testTokens("'this is a (\\'string\\')\\. Cool\\, eh\\?'", { value: "this is a ('string'). Cool, eh?" })
        testTokens("\"this is a (\\\"string\\\")\\. Cool\\, eh\\?\"", { value: "this is a (\"string\"). Cool, eh?" })
        testTokens("`this is a (\\`string\\`)\\. Cool\\, eh\\?`", { value: "this is a (`string`). Cool, eh?" })
    })

    it("quoted string", () => {
        testTokens("\"a b c\"", { kind: lexer.Kind.STRING, value: "a b c", text: '"a b c"' })
    })

    it("punctuation", () => {
        testTokens("(", { kind: Symbol.for("("), value: "(" })
        testTokens("()[]{}:$=;", 
            { kind: Symbol.for("("), value: "(" },
            { kind: Symbol.for(")"), value: ")" },
            { kind: Symbol.for("["), value: "[" },
            { kind: Symbol.for("]"), value: "]" },
            { kind: Symbol.for("{"), value: "{" },
            { kind: Symbol.for("}"), value: "}" },
            { kind: Symbol.for(":"), value: ":" },
            { kind: Symbol.for("$"), value: "$" },
            { kind: Symbol.for("="), value: "=" },
            { kind: Symbol.for(";"), value: ";" }
        )
    })

    it("comment", () => {
        testTokens(" 'hello' #this is a test", { kind: lexer.Kind.STRING, value: "hello" })
    })

    it("dollar then string", () => {
        testTokens("$'x']", { value: "$" }, { value: "x" }, { value: "]" })
    })

    it("whitespace", () => {
        testTokens(" \t\r\n ", ...[])
    })

    it("multi-line string", () => {
        testTokens("`this is a test\nthis is only a test`", { value: "this is a test\nthis is only a test"})
    })

})

function testTokens(text, ...expected) {

    const actual = Array.from(lexer.getTokens(text))

    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
        if (expected[i].kind && actual[i].kind !== expected[i].kind) {
            throw new Error(`Token ${i}: Expected kind ${Symbol.keyFor(expected[i].kind)}, got ${Symbol.keyFor(actual[i].kind)}`)
        }
        if (expected[i].value && actual[i].value !== expected[i].value) {
            throw new Error(`Token ${i}: Expected value ${expected[i].value}, got ${actual[i].value}`)
        }
        if (expected[i].text && actual[i].text !== expected[i].text) {
            throw new Error(`Token ${i}: Expected text ${expected[i].text}, got ${actual[i].text}`)
        }
    }

    if (actual.length-1 !== expected.length) {
        throw new Error(`Expected ${expected.length} tokens, got ${actual.length-1}`)
    }
}