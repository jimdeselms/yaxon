const { parse }  = require('./parser')

describe("parser", () => {
    it("number", () => {
        testValue("5", 5)
        testValue("'5'", "5")
    })

    it("string", () => {
        testValue("hello world how are you", "hello world how are you")
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
        testValue(".", null)
    })

    it("array tests", () => {
        testValue("[]", [])
        testValue("[6]", [6])
        testValue("[1 2]", [1,2])
        testValue(`[
            here are some strings
            on multiple lines
        ]`, ["here are some strings", "on multiple lines"])
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
        testTags("@X(name: 'fred') 123", { id: "X", args: { name: { tags: [], value: "fred"} }})
        testTags("@multiple1(a:1) @multiple2 hello", { id: "multiple1", args: {a: { tags: [], value: 1} }}, { id: "multiple2", args: {}})
    })

    it("tag with prefix", () => {
        testTags("@abc:def.", { id: "abc:def", args: {} })
    })

    it("tag with nested argument", () => {
        const expr = parse("@X(a: { b: [c] }).")
        expect(expr.tags[0].id).toEqual("X")
        expect(expr.tags[0].args.a.value).toEqual({ b: ["c"]})
    })

    it("tags without values", () => {
        testTags("@X.", { id: "X", args: {}})
        testValue("@X.", null)

        testTags("@X(name: fred).", { id: "X", args: {name: { tags: [], value: "fred"}}})
        testValue("@X(name: fred).", null)
    })

    it("quoted tag and argument", () => {
        testTags("@'Big Tag Name'('tag arg': 123).", 
            { id: "Big Tag Name", args: {"tag arg": { tags: [], value: 123 }}})
    })

    it("tag defining variable", () => {
        testTags("@X(a: $a b: $a = 5).", { id: "X", args: { a: { tags: [], value: 5}, b: { tags: [], value: 5} }})
    })

    it("tags with tags", () => {
        testTags("@X(a: @Y hello).", { id: "X", args: { a: { tags: [{ id: "Y", args: {}}], value: "hello"}}})
    })

    it("tags on properties", () => {
        const expr = parse("{ @A a: 50 @B1 @B2 b: 100 @C c.}")
        expect(expr.nodes.a.tags).toEqual([{ id: "A", args: {}}])
        expect(expr.nodes.b.tags).toEqual([{ id: "B1", args: {}}, { id: "B2", args: {}}])
        expect(expr.nodes.c.tags).toEqual([{ id: "C", args: {}}])

        expect(expr.value).toEqual({ a: 50, b: 100, c: null })
    })

    it("cycles", () => {
        // This structure has cycles. But it should be okay.
        const cyclic = parse("{ foo: $x=[$x] }")
        expect(cyclic.value.foo).toBe(cyclic.value.foo[0])
    })

    it("object referencing array", () => {
        testValue("{ n1: $f = [susan, john, doug, ricardo] n2: $f }",
            { 
                n1: ["susan", "john", "doug", "ricardo"], 
                n2: ["susan", "john", "doug", "ricardo"]
            })
    })

    it("big example", () => {
        const expr = `[
            {
                name: elmer
                city: New York City
                friends: $f = [susan, john, doug, ricardo]
            }
            {
                name: frida
                city: New York City
                friends: $f
            }
        ]`

        testValue(expr, [
            {
                name: "elmer",
                city: "New York City",
                friends: ["susan", "john", "doug", "ricardo"]
            },
            {
                name: "frida",
                city: "New York City",
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
