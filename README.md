# What is YAXON, and why?

YAXON attempts to be a useful language for describing data structures. There are many other languages that also
try to do this; the most common that we use today are JSON, XML, and YAML.

Each of these languages brings something interesting to the table, but we often try to use one of these languages for all
scenarios, and it doesn't always work out.

Any of these languages can represent any data structure under the sun, but they don't necessarily do it in the best way.

## XML to JSON

Let's start with XML. XML is a language used to describe "documents", which makes sense since XML (and HTML) are both derived from SGML,
which was the OG document description language. Let's consider a simple HTML document (I'll treat it like it's pure XML:)

    <html>
        <body>
            <a href="https://google.com">
                Let's Google!
            </a>
            <img src="https://pretty-kittens.com/kitten1.jpg" />
        </body>
    </html>

XML/HTML are great at describing nodes where each node not only defines some data, but also has a name. In this example, the root node of the document's name is "html". We can also see an "a" tag, which has an attribute "html" and a text child, "Let's Google!"

We could also represent this document in JSON. Since JSON nodes don't have names or types, we have to figure out some way to fit 
in the "html" or "a". We could try this:

    {
        "node": "html",
        "children": [
            {
                "node": "body",
                "children": [
                    {
                        "node": "a",
                        "href": "https://google.com",
                        "children": [
                            "Let's Google!"
                        ]
                    },
                    {
                        "node": "img",
                        "src": "https://pretty-kittens.com/kitten1.jpg"
                    }
                ]
            }
        ]
    }

That's pretty terrible. It's hard to read, hard to type etc. JSON isn't great at representing typed data sctructures very well. In
addition to that, while JSON is designed to be fast to read and write, it's not actually as *easy* to read or write as it could be; as a result there are some obvious optimizations that could be made to JSON, but they are omitted to keep the language as dirt simple as
possible. JSON doesn't allow comments. JSON requires quotes around every string, and commas after every item in the list, even thought there are no ambiguities that arise in the language as a result.

## XML to YAML

YAML attempts to solve some of the issues with JSON, but it's not perfect either. The document above would be represented like this in 
JSON:

    node: html
    children:
    - node: body
      children: 
      - node: a
        href: https://google.com
        children:
        - Let's Google!
      - node: img
        src: https://pretty-kittens.com/kitten1.jpg

That looks better, but it still feels clunky that you have to define the node type on every node.

## JSON to XML
We see that for representing typed objects, XML is superior to JSON. But it's got its own limitations.

Let's take a look at why XML isn't the silver bullet for everything. Let's imagine a very simple JSON document that 
describes an email message:

    {
        "subject": "Pizza Party!",
        "to": ["fred@yaxmail.com", "steve@yaxmail.com"],
        "cc": ["joe@joespizzaria.com"],
        "body": "Hey everybody, come to our pizza party on Saturday!',
        "format": "text"
    }

Though this is a really straightfoward example, it's not trivial to represent this in XML:

    <Email subject="Pizza Party!">
        <To>
            <Email address="fred@yaxmail.com" />
            <Email address="steve@yaxmail.com" />
        </To>
        <Cc>
            <Email address="joe@joespizzaria.com">
        </Cc>
        <Body>
            Hey everybody, come to our pizza party on Saturday!
        </Body>
    </Email>

This is pretty clunky too, even though the JSON is quite simple. In XML, an element can have attributes (for example,
"address" or "subject.") But the attributes must always be a scalar type like a string or number. In our JSON document, we have the "to" field, which very easily represents a list of email addresses, but to represent it with a new element type `Email`.

So how does YAXON fix this? YAXON attempts to merge the concepts of XML and Json. Here's how the first XML document above would look. Think of it as JSON, but with tags:

    @html [
        @body [
            @a(href: "https://google.com") "Let's Google!"
            @img(src: "https://pretty-kittens.com/kitten.jpg").
        ]
    ]

And how about our email message? That one doesn't need to change at all, because YAXON is actually just a superset of JSON (at least it's supposed to be; I'll write more unit tests to make sure that that's true.)

## YAML references
In addition to making JSON easier to read and write, YAML adds a cool 
feature that doesn't exist in XML or JSON: references.

References allow you to define a structure once in your document and
then reference it elsewhere. That way, you can avoid sending extra
data over the wire, but it also gives you a way to define cyclic 
data structures.

In this YAML document, if three people all live at the same house, we can define the address once, and then reference it repeatedly:

    people:
        - name: Fred
          address: &address1
            street1: 12 Main Street
            city: Awesomeville
            country: USA
        - name: Jane
          address: *address1
        - name: Sue
          address: *address1

Here's how we could represent the same structure in YAXON (note
that the commas are unnecessary, but might make it easier to
read if that's what you're used to:)

    {
        people: [
            {
                name: Fred
                address: $address1 = {
                    street1: "12 Main Street"
                    city: Awesomeville
                    country: USA
                }
            }
            { name: Jane, address: $address1 }
            { name: Sue, address: $address1 }
        ]
    }

## So what's wrong with YAML?
YAML has a much breezier syntax; it's much easier to read and write, and it includes comments and references. Why don't we just use it for everything?

First of all, YAML still isn't any better at describing XML-like documents than JSON is. But also, though it's more readable, being indentation-sensitive has its own issues; you can easily break a YAML document by inserting a space in the wrong place.

## Intro to YAXON

Since YAXON is a superset of JSON, you can do anything in YAXON that you can do in JSON. There are a few syntactic differences
though that make it easier to read and write:

* You don't ever need commas (you can still include them if it makes you feel better.)
* You can often omit the quotes on strings:
    * An unquoted string must begin with a character (or _).
    * The string may contain alphanumeric characters, and any punctuation that isn't otherwise significant in the
      language. For example, `This is an awesome/amazing string-thing!` is a valid unquoted YAXON string
    * You can escape characters in an unquoted string: `This is also a valid \(if not odd\) string\.`.
    * Some special reserved words must be quoted: `null`, `true`, and `false`. If they are not quoted, they will be treated
        like their literal values.
    * Numbers -- if not quoted -- are just treated like numbers.

If we take our email example from above, we can rewrite this in YAXON:

    {
        subject: Pizza Party!
        to: ["fred@yaxmail.com" "steve@yaxmail.com"]
        cc: ["joe@joespizzaria.com"]
        body: "Hey everybody, come to our pizza party on Saturday!"
        format: text
    }

### YAXON node types
A YAXON document has one single root node. A YAXON node has these possible types:
* String
* Boolean (`true` or `false`)
* Number
* Array
* BigInt
* Object (map)
* `null`

### YAXON tags
Any YAXON node can also have a number of tags. Tags provide additional metadata or context. Tags have a name, and they have an optional set of name/value pairs.

Examples:

    @Person {
        name: Fred
        age: 20
    }

    @Set(initialSize: 1000) [
        Fred
        Melinda
        Steve
        Stephanie
    ]

    # A list of pets
    [
        @Pet(owner: Steve) @Dog(breed: Husky) { name: Fido }
        @Pet(owner: Melinda) @Turtle { name: Fluffy }
    ]

Tags don't even have to be assigned to a value. You can either do this by assigning your tag to `null`, or you can just follow the tag with a period (`.`).

    @JustATag null

    @AlsoJustATag.

#### More about converting XML to YAXON

YAXON tags are the most straightforward way to represent an XML-style structure.

You can map any XML structure directly into YAXON by following these rules:

* Element names become tag names
* An elements attributes become arguments to the tag
* The tag's children are represented as a an array of nodes following the tag

Consider this example:

    <Element attr1="123" attr2="hello">
        Hello
        <hr/>
        Goodbye
    </Element>

This converts directly to:

    @Element(attr1: 123, attr2: hello) [
        Hello
        @hr.
        Goodbye
    ]

#### Defining tags on objects/maps

There are two allowed syntaxes for tagging the fields on an object.

Technically, you're tagging the *object* that the field references, not the field itself.

So, intuitively, you can do this:

    {
        family: The Smiths
        familyPet: @Pet(owner: Billy) @Dog(breed: Husky) {
            name: Fido
        }
    }

This looks a little clunky. This syntax is also supported, with the field's tags *before*
the key:

    {
        family: The Smiths

        @Pet(owner: Billy)
        @Dog(breed: Husky)
        familyPet: {
            name: Fido
        }
    }

In this version, we can stack up the tags, making it a bit easier to read.

In the previous section, we learned that there's a syntactic convenience for tagging null (`@Tag.`). You
can also tag null in an object like this:

    {
        name: Steve

        @Tag
        familyPet.       
    }

In addition to a syntactic convenience for tagging `null` (instead of `@Tag: null`, you can do `@Tag.`)


## YAXON variables
In YAXON, you can use variables to repeat snippets of your document. You can also use them to add tags to a node in the document without actually finding
that node and modifying it. You might have a very large document that defines a node deep in its structure, and for clarity's sake, you might define
its tags in multiple places in the document. If you use a library that allows you to read in multiple documents, this can give you a method of 
merging multiple disparate domains into one large document.

Define variables like this:

    $newtonZip = 02465

And reference a variable like this:

    {
        name: Fred
        city: Newton
        zip code: $newtonZip
    }

**Note:** Variables must be unique throughout the document. Consider using some kind of prefix to namespace your tags.
### Amending nodes

You can use variables to add more tags to a node defined elsewhere in your document.

Let's say you have a document that defines a very deep structure:

    {
        ...
            {
                address.
                city.
                $zipCode = zip code.
            }

    @DisplayName(name: Zip Code)
    $zipCode.

or:

    $zipCode: @DisplayName(name: Zip Code).

## YAXON strings
In YAXON, you can always wrap strings in single quotes (') or double quotes ("). 

You can also denote multi-line strings with the backtick (`) character.

You can escape any character with the backslash (\)

But also, many strings don't need quotes at all. If a sequence of characters starts with a letter or underscore (_), then it will be
treated as as string and will terminate at the end of line, or the next
syntactically-significant character, like parentheses, braces, colons, commas, etc.

Here is an example of an array filled with legal strings:

    [
        this is a perfectly legal string
        here\'s another one with some escaped characters in it
        "Here's another string"
        'And here\'s another one.'
        `And here's a multi-line string 
            for good measure.`
    ]

### YAXON identifiers
There are certain contexts in which YAXON strings are (by default)
limited to a single word: 
* tag names
* tag argument names

For example:

    @this-tag-must-be-one-word(this-arg-too: 123).

If you really want a tag or argument name to have spaces in it, you
can still use quotes:

    @"this tag is multiple words"("this arg too": 123).

## Usage

    const YAXON = require('yaxon')

    const yaxonString = YAXON.stringify({ name: "Fred" })

    const doc = YAXON.parse(yaxonString)

Once you've got the document, you can access the document --
minus tags -- using the value property:

    const doc = YAXON.parse("{ name: Fred Wilkerson }")

    expect(doc.value.name).toBe("Fred Wilkerson")

Here is the schema for the result of YAXON.parse (Typescript-style):

    interface Node<T> {
        tags: Tag[]
        value: T
    }

    interface Tag {
        id: string
        args: Record<string, AnyNode>
    }

    type AnyNode = Node<any>
    type StringNode = Node<string>
    type NumberNode = Node<number>
    type BigintNode = Node<bigint>
    type BooleanNode = Node<boolean>
    type NullNode = Node<null>

    interface ObjectNode extends Node<Object> {
        nodes: Record<string, AnyNode>
    }

    interface ArrayNode extends Node<any[]> {
        nodes: AnyNode[]
    }

# Tags for defining aspects

We've seen that tags can be used to model XML-style data. We can also use tags to separate out different aspects of our
data. You could imagine using YAXON to define a very simple schema of fields and values.

    {
        person: {
            ssn.
            employer.
            address: {
                street.
                zipCode.
            }
        }

        employer: {
            id.
            name.
        }
    }

I can also use tags to hang different aspects of data on that simple framework. Here's an example that shows how we might represent
various database and security concerns:

    {
        @Table(tableName: person_table)
        person: {
            ssn: @Secret @PrimaryKey.

            @NotifyOnChange(email: "fred@fredco.com")
            employer: @TableRef(tableName: employer_table).
            address: {
                street.
                zipCode.
            }
        }

        @Table(tableName: employer_table)
        employer: {
            id.
            name.
        }
    }

In this example, we tag `person` and `employer` with a `@Table` tag, which tells us the name of the database table. We have the `ssn` field marked
`@Secret` which might mean that it's not displayed on the screen, or perhaps it means that only certain users have permission to see it. Or,
if a person's employer changes, we use the `@NotifyOnChange` tag to indicate who should get an email if that happens.

Of course we can model all of this in JSON or XML. But tags can make your document a lot cleaner, and they just give a different dimension of expressiveness that probably 
has other applications I haven't thought of.