const { parse } = require('./parser')
const { join } = require('./join')

describe("join", () => {
    test("object join", () => {
        const node = parse("{ a: 1 }", "{ b: 2 }")

        expect(node).toMatchObject({ 
            tags: [],
            nodes: {
                a: { tags: [], value: 1 },
                b: { tags: [], value: 2 }
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
        const node = parse("$x = Hello", "$x")

        expect(node).toMatchObject({
            value: "Hello"
        })
    })
})
