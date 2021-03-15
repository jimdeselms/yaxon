# YAXON (I'll come up with a better name later)

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

XML/HTML are great at describing nodes where each node not only defines some data, but also has a name. The root node of the 
document's name is "html". We can also see an "a" tag, which has an attribute "html" and a text child, "Let's Google!"

We could also represent this document in XML. Since JSON nodes don't have names or types, we have to figure out some way to fit 
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

That's pretty terrible. It's hard to read, hard to type etc. JSON isn't great at representing typed-sctructures very well. In
addition to that, JSON is designed to be fast to read and write, its emphasis is not actually on being as easy to read and write
as it could be; as a result there are some obvious optimizations that could be made to JSON to make it easier to read and write. JSON
doesn't allow comments. JSON requires quotes around every string, and commas after every item in the list, even thought there are no
ambiguities that arise in the language as a result.

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
We see that for representing typed objects, XML is superior to JSON. But it's also got its limitations.

Let's take a look at why XML isn't the silver bullet for everything. Let's imagine a very simple JSON document that 
describes an email message:

    {
        "subject": "Pizza Party!",
        "to": ["fred@xmail.com", "steve@xmail.com"],
        "cc": ["joe@joespizzaria.com"],
        "body": "Hey everybody, come to our pizza party on Saturday!',
        "format": "text"
    }

Though this is a really straightfowrad example, it's not trivial to represent this in XML:

    <Email subject="Pizza Party!">
        <To>
            <Email address="fred@xmail.com" />
            <Email address="steve@xmail.com" />
        </To>
        <Cc>
            <Email address="joe@joespizzaria.com">
        </Cc>
        <Body>
            Hey everybody, come to our pizza party on Saturday!
        </Body>
    </Email>

This is pretty clunky too, even though the JSON is quite simple. In XML, an element can have attributes (for example,
"address" or "subject.") But the attributes must always be a scalar type. In our JSON document, we have the "to" field, which
very easily represents a list of email addresses.

So how does YAXON fix this? YAXON attempts to merge the concepts of XML and Json. Here's how the first XML document above would look:

    @html [
        @body [
            @a(href: "https://google.com") "Let's Google!"
            @img(src: "https://pretty-kittens.com/kitten.jpg")
        ]
    ]

And how about our email message? That one doesn't need to change at all! Because YAXON is actually just a superset of JSON (at least it's
supposed to be.)

## What's wrong with YAML?
YAML attemps to fix JSON by making it easier to read and write, but it also adds a cool feature: references.

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

YAML has a breezier syntax; by being aware of indentation, the language is quite easy to read. However, if you mess up the indentation
in your YAML document, it screws everything up.

## Intro to YAXON

Since YAXON is a superset of JSON, you can do anything in YAXON that you can do in Json. There are a few syntactical differences
thought hat make it easier to read and write:

* You don't ever need commas (you can still include them if it makes you feel better.)
* A single-word string never needs to have quotes
    * Exceptions: if you want a number to be treated as a string, put it in quotes. Likewise, special reserved words (`null`, `true`, `false`) will be treated like their values. If you want them to be treated as strings, wrap them in quotes.

If we take our email example from above, we can rewrite this in YAXON:

    {
        subject: "Pizza Party!"
        to: ["fred@xmail.com" "steve@xmail.com"]
        cc: ["joe@joespizzaria.com"]
        body: "Hey everybody, come to our pizza party on Saturday!
        format: text
    }

YAXON also includes references. Here's how we would represent the YAML above in YAXON:

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
            {
                name: Jane
                address: $address1
            }
            {
                name: Sue
                address: $address1
            }
        ]
    }

### YAXON node types
A YAXON document has one single root node. A YAXON node has these possible types:
* String
* Boolean (`true` or `false`)
* Number
* Array
* Object (map)
* `null`

### YAXON tags
Any YAXON node can also have a number of tags. Tags provide additional information or context. Tags have a name, and they have an optional set of 
name/value pairs. In these examples, 

Examples:

    @Person {
        name: Fred
        age: 20
    }

    @Set(initialSize: 1000) [
        Fred
        Melinda
        Steve
        Stephony
    ]

Tags don't actually even have to be assigned to a value. You can either do this by assigning your tag to `null`, or you can just follow the tag with a period (`.`).

    @JustATag null

    @AlsoJustATag.

