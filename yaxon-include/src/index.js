const fs = require("fs").promises
const path = require("path")
const { parse, join } = require("yaxon")

async function loadText(text, name=undefined) {
    // Parse the yaxon:
    const yxnDoc = parse({ file: name, text: text })

    // Our contract is simple. Find all the "Load" tags on the root node.
    const tags = yxnDoc.tags.filter(t => t.id === "Include")
    const docs = []

    for (const tag of tags) {
        const file = tag.args.file
        if (file && file.value) {
            const filename = name 
                ? path.resolve(path.dirname(path.resolve(name)), file.value)
                : name

            docs.push(await loadFile(filename))
        }
    }

    return join(yxnDoc, ...docs)
}

async function loadFile(name) {
    // First, get the actual contents of the file.
    const yxn = await fs.readFile(name, 'utf-8')

    return await loadText(yxn, name)
}

module.exports = {
    loadText,
    loadFile,
    // loadFolder,
    // loadUrl
}