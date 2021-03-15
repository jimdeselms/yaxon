const { parse }  = require('./parser')

describe("parser", () => {
    it("number", () => {
        testValue("5", 5)
        testValue("'5'", "5")
    })

    it("string", () => {
        testValue("hello-world-how-are-you", "hello-world-how-are-you")
        testValue('"quoted string"', "quoted string")
        testValue("'quoted string'", "quoted string")
    })

    it("variable", () => {
        testValue("[$a=1 $'a']", [1, 1])
        testValue("{a: $a = 123 b: $a }", {a: 123, b: 123})
        testValue("{a: $a = [1 2 3] b: $a }", {a: [1, 2, 3], b: [1, 2, 3]})
        testValue("{a: [1 $x=2 $y=3] x: $'x' y: $y }", {a: [1, 2, 3], x: 2, y: 3})
    })

    it("special strings", () => {
        testValue("true", true)
        testValue("'true'", "true")
        testValue("false", false)
        testValue("'false'", "false")
        testValue("null", null)
        testValue("'null'", "null")
    })

    it("array tests", () => {
        testValue("[]", [])
        testValue("[6]", [6])
        testValue("[1 2]", [1,2])
        testValue(`[
            here-are-some-strings
            on-multiple-lines
        ]`, ["here-are-some-strings", "on-multiple-lines"])
        testValue("[[][1][1 2]]", [[], [1], [1, 2]])
    })

    it("object tests", () => {
        testValue("{}", {})
        testValue("{a:1}", {a:1})
        testValue("{a:1 b:2}", {a:1,b:2})
        testValue(`{
            here-is-an-example: 123
            of-an-object : on-multiple-lines
            isn't-that-cool : yes-it-is
        }`, { "here-is-an-example": 123, "of-an-object": "on-multiple-lines", "isn't-that-cool": "yes-it-is"})
    })

    it("tags without args", () => {
        testValue("@this-is-a-test 5", 5) 
        testValue("@this isalsoatest", "isalsoatest")

        testTags("@this-is-a-test 5", { id: "this-is-a-test", args: {} })
        testTags("@this isalsoatest", { id: "this", args: {} })
    })

    it("tags with args", () => {
        testTags("@X(name: 'fred') 123", { id: "X", args: { name: "fred" }})
        testTags("@multiple1(a:1) @multiple2 hello", { id: "multiple1", args: {a:1}}, { id: "multiple2", args: {}})
        testTags("@X(a: { b: [c]}).", { id: "X", args: { a: { b: ["c"]}}})
    })

    it("tags without values", () => {
        testTags("@X.", { id: "X", args: {}})
        testValue("@X.", null)

        testTags("@X(name: fred).", { id: "X", args: {name: "fred"}})
        testValue("@X(name: fred).", null)
    })

    it("tag defining variable", () => {
        testTags("@X(a: $a b: $a = 5).", { id: "X", args: { a: 5, b: 5 }})
    })

    it("cycles", () => {
        // This structure has cycles. But it should be okay.
        const cyclic = parse("{ foo: $x=[$x] }")
        expect(cyclic.value.foo).toBe(cyclic.value.foo[0])
    })

    it("object referencing array", () => {
        testValue("{ n1: $f = [susan john doug ricardo] n2: $f }",
            { 
                n1: ["susan", "john", "doug", "ricardo"], 
                n2: ["susan", "john", "doug", "ricardo"]
            })
    })
    it("big example", () => {
        const expr = `[
            {
                name: jim
                address: "16 henshaw st"
                friends: $f = [susan john doug ricardo]
            }
            {
                name: susan
                address: "16 henshaw st"
                friends: $f
            }
        ]`

        testValue(expr, [
            {
                name: "jim",
                address: "16 henshaw st",
                friends: ["susan", "john", "doug", "ricardo"]
            },
            {
                name: "susan",
                address: "16 henshaw st",
                friends: ["susan", "john", "doug", "ricardo"]
            }
        ])
    })
})

function testValue(text, expected) {
    const expr = parse(text)
    expect(expr.value).toEqual(expected)
}

function testTags(text, ...expected) {
    const expr = parse(text)
    expect(expr.tags).toEqual(expected)
}