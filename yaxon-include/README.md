# yaxon-include

This allows you to read in a YAXON document from a file or URL, and that file or URL can in turn include more files.

## Specification

This package looks for the `@Include` tag on the top level node of the YAXON document *only*. (Perhaps in a future version, we'll allow documents
to be included deeper in the structure.)

The `@Include` node allows you to specify a file or url to read from; each document will be merged with whatever is at the root node.

### @Include(file: string)

When you specify the `file` parameter, yaxon-include will load the given file from the file system.

You may specify a relative path, and that path wil be relative to the file that was requested.

### @Include(url: string)

When you specify the `url` parameter, yaxon-include will do an HTTP get request to get the given YAXON file.

You may specify a relative URL, and that URL will resolve based on the location of the current document.

## Usage

    npm install yaxon-include

yaxon-include exports three functions which you can use:

### loadFile

`loadFile` loads the given file from the file system.

    const doc = await loadFile(filename)

### loadUrl

`loadUrl` loads the given file using an HTTP get

    const doc = await loadUrl(url)

### loadText

`loadText` loads the document from inline text.

Relative paths are not possible in documents that were loaded with `loadText` (though their downstream includes may.)

    const doc = await loadText("@Include(url: 'www.example.com/yxn'))
