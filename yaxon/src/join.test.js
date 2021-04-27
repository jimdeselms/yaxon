const { parse, join } = require('./parser')

describe("join", () => {
    test("object join", () => {
        const node = parse("{ a: 1 c: { foo: [bar] } }", "{ b: 2 c: { foo: [baz] } }")

        expect(node).toMatchObject({ 
            tags: [],
            nodes: {
                a: { value: 1 },
                b: { value: 2 },
                c: { nodes: {
                    foo: {
                        nodes: [ { value: 'bar' }, { value: 'baz' }]
                    }
                }}
            }
        })
    })

    test("array join", () => {
        const node = parse("[5 10 15]", "[20 25 30]")

        expect(node).toMatchObject({ 
            nodes: [
                { value: 5 },
                { value: 10 },
                { value: 15 },
                { value: 20 },
                { value: 25 },
                { value: 30 }
            ]
        })
    })

    test("join varref and vardef", () => {
        expect(parse("$x = Hello", "$x")).toMatchObject(
            {
                value: "Hello"
            })

        expect(parse("$x", "$x = Hello")).toMatchObject(
            {
                value: "Hello"
            })
    })

    test("cross-file amendment", () => {
        expect(parse("$x = Hello", "@Hello $x.")).toMatchObject(
            {
                tags: [ { id: "Hello" }],
                value: "Hello"
            })

        expect(parse("@Hello $x.", "$x = Hello")).toMatchObject(
            {
                tags: [ { id: "Hello" }],
                value: "Hello"
            })
        expect(parse("@Hello $x.", "$x = @World Hello")).toMatchObject(
            {
                tags: [ { id: "World", args: {} }, { id: "Hello", args: {} } ],
                value: "Hello"
            })
    })

    test("parse-then-join array", () => {
        const node = parseThenJoin("[5 10 15]", "[20 25 30]")

        expect(node).toMatchObject({ 
            nodes: [
                { value: 5 },
                { value: 10 },
                { value: 15 },
                { value: 20 },
                { value: 25 },
                { value: 30 }
            ]
        })
    })
    test("parse-then-join object", () => {
        const node = parseThenJoin("{a: 1, c: { x: 1 }}", "{b: 2, c: { y: 2 }}")

        expect(node).toMatchObject({ 
            nodes: {
                a: { value: 1 },
                b: { value: 2 },
                c: {
                    nodes: {
                        x: { value: 1 },
                        y: { value: 2 }
                    }
                }
            }
        })
    })

    test("parse-then-join vardef and varref", () => {
        expect(parseThenJoin("$x = Hello", "$x")).toMatchObject(
            {
                value: "Hello"
            })
    })

    test("parse-then-join cross-file amendment", () => {
        expect(parseThenJoin("$x = Hello", "@Hello $x.")).toMatchObject(
            {
                tags: [ { id: "Hello" }],
                value: "Hello"
            })

        expect(parseThenJoin("@Hello $x.", "$x = Hello")).toMatchObject(
            {
                tags: [ { id: "Hello" }],
                value: "Hello"
            })
        expect(parseThenJoin("@Hello $x.", "$x = @World Hello")).toMatchObject(
            {
                tags: [ { id: "World", args: {} }, { id: "Hello", args: {} } ],
                value: "Hello"
            })
    })


})

function parseThenJoin(...texts) {
    const docs = texts.map(t => parse(t))

    return join(...docs)
}
