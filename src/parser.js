const lexer = require('./lexer')
const { join } = require('./join')
const { linkReferences } = require("./linker")
const YaxonNode = require('./YaxonNode')

const Kind = lexer.Kind

function parse(...texts) {
    let ast = null

    for (const text of texts) {
        const p = new Parser(text)
        const newAst = p.parseDocument()
        ast = join(ast, newAst)
    }

    return linkReferences(ast)
 }

class Parser {
    constructor(text) {
        this.tokens = lexer.getTokens(text)[Symbol.iterator]()
        this.itState = this.tokens.next()
    }

    parseDocument() {
        let amend = true
        let result
        const amendments = []

        while (this._peek().kind !== Kind.EOF) {
            const node = this.parseAssignment(amend)
            if (node.amend) {
                amend = false
                amendments.push(node)
            } else {
                result = node
            }
        }

        return { ...result, amendments }
    }

    parseAssignment(amend) {
        const token = this._peek(Kind.DOLLAR, Kind.NUMBER, Kind.STRING, Kind.LEFT_BRACKET, Kind.LEFT_BRACE)
        if (token.kind == Kind.DOLLAR) {
            this._match(Kind.DOLLAR)
            const id = this._match(Kind.STRING)
            if (this._peek().kind === Kind.EQUALS) {
                this._match(Kind.EQUALS)
                const node = this.parseTaggedNode(false)
                return new YaxonNode({ ...node, vardef: id.value })
            } else if (amend && this._peek().kind === Kind.COLON) {
                this._match(Kind.COLON)
                const node = this.parseTaggedNode(false)
                return new YaxonNode({ ...node, amend: id.value })
            } else if (this._peek().kind === Kind.DOT) {
                this._match(Kind.DOT)
                return new YaxonNode({ value: null, amend: id.value })
            } else {
                return new YaxonNode({ varref: id.value })
            }
        } else {
            return this.parseTaggedNode(amend)
        }
    }

    parseTaggedNode(amend) {
        const tagList = this.parseTagList()
        const node = this.parseNode(amend)

        if (amend && node.varref && this._peek().kind === Kind.DOT) {
            this._match(Kind.DOT)
            return new YaxonNode({ tags: tagList, amend: node.varref })
        } else {
            return new YaxonNode({ ...node, tags: tagList })
        }
    }

    parseTagList() {
        const tags = []

        while (true) {
            const token = this._peek(Kind.AT_SIGN, Kind.NUMBER, Kind.STRING, Kind.LEFT_BRACKET, Kind.LEFT_BRACE)
            if (token.kind === Kind.AT_SIGN) {
                this._match(Kind.AT_SIGN)
                const id = this._match(Kind.STRING)

                const args = {}
                if (this._peek().kind === Kind.LEFT_PAREN) {
                    for (const [key, node] of this.parseKeyValuePairs(Kind.LEFT_PAREN, Kind.RIGHT_PAREN)) {
                        args[key] = node
                    }
                }
                tags.push(new YaxonNode({ id: id.value, args }))
            } else {
                return tags
            }
        }
    }

    parseNode(amend) {
        const token = this._peek(Kind.NUMBER, Kind.STRING, Kind.LEFT_BRACKET, Kind.LEFT_BRACE)

        if (amend && token.kind === Kind.DOLLAR) {
            this._match(Kind.DOLLAR)
            const id = this._match(Kind.STRING)
            return new YaxonNode({ varref: id.value })
        }
        switch (token.kind) {
            case Kind.NUMBER: return this.parseNumber()
            case Kind.STRING: return this.parseString()
            case Kind.LEFT_BRACKET: return this.parseArray()
            case Kind.LEFT_BRACE: return this.parseObject()
            case Kind.DOT: return this.parseNullAbbreviation()
            default: throw new Error(`Unexpected token ${token.text} (${token.kind.toString()})`)
        }
    }

    parseNumber() {
        const token = this._match(Kind.NUMBER)
        return new YaxonNode({ value: token.value })
    }

    parseString() {
        const token = this._match(Kind.STRING)

        switch (token.text) {
            case "true": return new YaxonNode({ value: true })
            case "false": return new YaxonNode({ value: false })
            case "null": return new YaxonNode({ value: null })
            default: return new YaxonNode({ value: token.value })
        }
    }

    parseArray() {
        this._match(Kind.LEFT_BRACKET)

        const values = []

        while (!(this._peek().kind === Kind.RIGHT_BRACKET)) {
            values.push(this.parseAssignment())
        }

        this._match(Kind.RIGHT_BRACKET)

        return new YaxonNode({ nodes: values })
    }

    parseObject() {
        const nodes = {}

        for (const [key, node] of this.parseKeyValuePairs(Kind.LEFT_BRACE, Kind.RIGHT_BRACE)) {
            nodes[key] = node
        }
        
        return new YaxonNode({ nodes })
    }

    parseKeyValuePairs(open, close) {
        const result = []

        this._match(open)

        while (!(this._peek().kind === close)) {
            const tags = this.parseTagList()

            // This is a shorthand for a variable definition.
            // Instead of saying
            //   { x: $x = 123 }
            // you can say
            //   { $x = 123 }
            //
            // Also, instead of 
            //   { x. }
            // you can say
            //   { $x. }
            const isVardef = this._peek().kind === Kind.DOLLAR
            let key, node
            if (isVardef) {
                this._match(Kind.DOLLAR)
                key = this._match(Kind.STRING)
                const next = this._peek(Kind.EQUALS, Kind.DOT)
                if (next.kind === Kind.EQUALS) {
                    this._match(Kind.EQUALS)
                    node = this.parseAssignment()
                } else {
                    node = this.parseNullAbbreviation()
                }
            } else {
                key = this._match(Kind.NUMBER, Kind.STRING)
                const next = this._peek(Kind.COLON, Kind.DOT)
                if (next.kind === Kind.COLON) {
                    this._match(Kind.COLON)
                    node = this.parseAssignment()
                } else {
                    node = this.parseNullAbbreviation()
                }
            }

            // const next = this._peek(Kind.COLON, Kind.DOT)
            // let node
            // if (next.kind === Kind.COLON) {
            //     this._match(Kind.COLON)
            //     node = this.parseAssignment()
            // } else {
            //     node = this.parseNullAbbreviation()
            // }

            if (isVardef) {
                node.vardef = key.value
            }

            node.tags = [...tags, ...node.tags || []]

            result.push([key.value, node])
        }

        this._match(close)

        return result
    }

    parseNullAbbreviation() {
        this._match(Kind.DOT)
        return new YaxonNode({ value: null })
    }

    _peek(...kinds) {
        return this._matchImpl(kinds, false)
    } 

    _match(...kinds) {
        return this._matchImpl(kinds, true)
    }

    _matchImpl(kinds, advance=true) {
        let token

        if (kinds.length > 0) {
            const matchingKind = kinds.find(k => this.itState.value.kind)
            if (!matchingKind) {
                const msg = kinds.length === 1
                    ? `Expected ${Symbol.keyFor(kinds[0])}, got ${this.itState.value.kind} instead`
                    : `Expected one of ${kinds.map(k => Symbol.keyFor(k)).join(", ")}, got ${this.itState.value.kind} instead`
                throw new Error(msg)
            }
        }

        token = this.itState.value

        if (advance) {
            this.itState = this.tokens.next()
        }

        return token
    }
}

module.exports = {
    parse
}