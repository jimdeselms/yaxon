const fs = require("fs").promises
const path = require("path")
const YAXON = require("yaxon")
const axios = require("axios")

async function loadText(text, name=undefined) {
    // Parse the yaxon:
    const yxnDoc = YAXON.parse({ file: name, text: text })

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
            continue
        }

        const url = tag.args.url
        if (url && url.value) {
            const combinedUrl = name && isAbsoluteUrl(name) && !isAbsoluteUrl(url.value)
                ? combineAbsoluteAndRelative(name, url.value)
                : url.value

            docs.push(await loadUrl(combinedUrl))
            continue
        }
    }

    return YAXON.join(yxnDoc, ...docs)
}

async function loadFile(name) {
    // First, get the actual contents of the file.
    const yxn = await fs.readFile(name, 'utf-8')

    return await loadText(yxn, name)
}

async function loadUrl(url) {
    const response = await axios.get(url)
    return await loadText(response.data, url)
}

function isAbsoluteUrl(url) {
    return !!url.match(/(^[a-z][a-z0-9+.-]*:|\/\/)/)
}

function combineAbsoluteAndRelative(absolute, relative) {
    const url = new URL(absolute)
    url.pathname = path.join(path.dirname(url.pathname), relative)
    return url.toString()
}

module.exports = {
    loadText,
    loadFile,
    loadUrl
}
