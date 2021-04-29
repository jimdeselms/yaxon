const { loadFile, loadUrl } = require('./index')
const MockAdapter = require('axios-mock-adapter').default
const axios = require('axios')

const mockAxios = new MockAdapter(axios)

describe("loadFile", () => {
    test("simpleTest", async () => { 
        const doc = await loadFile('test-files/file1.yxn')

        expect(doc.value).toBe("Hello world")
    })
})

describe("loadUrl", () => {
    afterEach(() => {
        mockAxios.reset()
    })

    test("absolute url", async () => {

        mockAxios.onGet("https://fooballs.com/hello/doc1").reply(200, "@Include(url: 'https://fooballs.com/hello/doc2').")
        mockAxios.onGet("https://fooballs.com/hello/doc2").reply(200, "Hello there")

        const doc = await loadUrl("https://fooballs.com/hello/doc1")
        expect(doc.value).toBe("Hello there")
    })

    test("relative url", async () => {

        mockAxios.onGet("https://fooballs.com/hello/doc3").reply(200, "@Include(url: '../doc4').")
        mockAxios.onGet("https://fooballs.com/doc4").reply(200, "Hello there")

        const doc = await loadUrl("https://fooballs.com/hello/doc3")
        expect(doc.value).toBe("Hello there")
    })

    test("multiple", async () => {
        mockAxios.onGet("https://fooballs.com/colors").reply(200, `
            @Include(url: '../red')
            @Include(url: '../white')
            @Include(url: '../blue').
        `)
        mockAxios.onGet("https://fooballs.com/red").reply(200, "[red]")
        mockAxios.onGet("https://fooballs.com/white").reply(200, "[white]")
        mockAxios.onGet("https://fooballs.com/blue").reply(200, "[blue]")

        const doc = await loadUrl("https://fooballs.com/colors")
        expect(doc.value).toMatchObject(["red", "white", "blue"])
    })

    // TODO:
    // * Test that we can't include a relative URL with an absolute file path
    // * Test that we can't include a relative file with an absolute URL
    // * Do we need to distinguish between files and urls? Can't we just detect
    //   which is which, and if the second is relative, then we'll make it relative
    //   to whatever was passed in before.
    // * Or, do we want to support globs?
})