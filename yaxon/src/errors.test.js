const { parse }  = require('./parser')

describe("error handling", () => {
    test("lexer error", () => {
        testError('~', "Unexpected character '~' (1:1)")
    })

    test("matching error", () => {
        testError("[", "Unexpected token 'EOF' (1:2)")
    })
})

function testError(text, errorMessage) {
    try {
        const expr = parse(text)
        fail("Expected parse to fail, but it didn't.")
    } catch (err) {
        expect(err.message).toEqual(errorMessage)
    }
}
