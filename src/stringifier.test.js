const { stringify } = require('./stringifier')

describe('stringifier', () => {
    it('quotes strings when needed', () => {
        testStringifier("hello world", '"hello world"')
        testStringifier("500", '"500"')
        testStringifier("true", '"true"')
        testStringifier("false", '"false"')
        testStringifier("null", '"null"')
        testStringifier("justAWord1234_34", "justAWord1234_34")
    })

    it('words that should not be quoted', () => {
        testStringifier(null, "null")
        testStringifier(true, "true")
        testStringifier(false, "false")
        testStringifier(3.1416, "3.1416")
    })

    it('arrays', () => {
        testStringifier([], "[]")
        testStringifier(["hello"], "[hello]")
        testStringifier([1, 2, [], [1, 2], 5], "[1 2 [] [1 2] 5]")
    })

    it("objects", () => {
        testStringifier({}, "{}")
        testStringifier({a: "b"}, "{a:b}")
        testStringifier({"howdy": "doody"}, "{howdy:doody}")
        testStringifier({a: {"hello world": [123]}}, "{a:{\"hello world\":[123]}}")
    })

    it("references", () => {
        const hello = "ThisIsALongEnoughString"
        const doc = [ hello, hello ]
        testStringifier(doc, "[$v1=ThisIsALongEnoughString $v1]")
    })
})

function testStringifier(expr, expected) {
    const result = stringify(expr)
    expect(result).toEqual(expected)
}