const lexer = require('./lexer')

describe("lexer", () => {
    it("integer", () => {
        testTokens("3", { kind: lexer.Kind.INTEGER, value: 3, text: "3" })
        testTokens("5123", { kind: lexer.Kind.INTEGER, value: 5123, text: "5123" })
        testTokens("-5123", { kind: lexer.Kind.INTEGER, value: -5123, text: "-5123" })
    })
    
    // it("bigint", () => {
    //     const x = lexer.getTokens("3n")
    //     testTokens("3n", { kind: lexer.Kind.BIGINT, value: 3n, text: "3n"})
    // })

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

    it("unquoted string after tag operator", () => {
        testTokens("@a:b",
            { kind: lexer.Kind.AT_SIGN },
            { kind: lexer.Kind.STRING, text: "a:b" })
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

    describe("mutli-line-strings", () => {
        it("by default, it trims, and newlines are wrapped.", () => {
            testTokens("` test \n test \n\n test `", { value: "test test\ntest"})
        })

        it("if the first line of the multiline string is empty, then don't join lines", () => {
            testTokens("`\nhello\nworld\n\nbye`", { value: "hello\nworld\n\nbye"})
        })
    })

    it("numbers", () => {
        testTokens("3.14159", { value: 3.14159, kind: lexer.Kind.NUMBER })
        testTokens("-3.14159", { value: -3.14159 })
        testTokens("+3.14159", { value: 3.14159 })
        testTokens("3e10", { value: 3e10 })
        testTokens("3.14e10", { value: 3.14e10 })
        testTokens("3.14E10", { value: 3.14e10 })
        testTokens("3.14E-10", { value: 3.14e-10 })
        testTokens("3.14E+10", { value: 3.14e+10 })
        testTokens("0", { value: 0 })

        // Did you know that "00" is not valid JSON?
        testTokens("00", { value: 0 })
    })

    it("escaped chars", () => {
        testTokens("'a\\nb'", { value: "a\nb" })
        testTokens("a\\nb", { value: "a\nb" })
        testTokens("a\\nb\\nc", { value: "a\nb\nc"})
        testTokens("smile\\u9999", "smile\u9999")
    })
})

describe("positioning", () => {
    it("simple case", () => {
        // Note that the last token is always the EOF.
        testPosition("abc : 5",
            { line: 1, column: 1, source: "file.yxn" },
            { line: 1, column: 5, source: "file.yxn" },
            { line: 1, column: 7, source: "file.yxn" },
            { line: 1, column: 8, source: "file.yxn" })
        })
    it("multiple lines", () => {
        // Note that the last token is always the EOF.
        testPosition("abc\ndef;ghi\njkl",
            { line: 1, column: 1 },
            { line: 2, column: 1 },
            { line: 2, column: 4 },
            { line: 2, column: 5 },
            { line: 3, column: 1 },
            { line: 3, column: 4 })
        })
    })

function testTokens(text, ...expected) {

    const actual = Array.from(lexer.getTokens(text, "file.yxn"))

    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
        if (expected[i].kind && actual[i].kind !== expected[i].kind) {
            throw new Error(`Token ${i}: Expected kind ${expected[i].kind}, got ${actual[i].kind}`)
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

function testPosition(text, ...expected) {
    const actual = Array.from(lexer.getTokens(text, "file.yxn"))

    for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
        const currActual = actual[i]
        const currExpected = expected[i]

        if (currExpected.line) expect(currActual.line).toBe(currExpected.line)
        if (currExpected.column) expect(currActual.column).toBe(currExpected.column)
        if (currExpected.source) expect(currActual.source).toBe(currExpected.source)
    }

    expect(actual.length).toBe(expected.length)
}