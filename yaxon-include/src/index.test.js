const { loadFile } = require('./index')

describe("loadFile", () => {
    test("simpleTest", async () => { 
        const doc = await loadFile('test-files/file1.yxn')

        expect(doc.value).toBe("Hello world")
    })
})