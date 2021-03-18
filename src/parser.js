const lexer = require('./lexer')
const { linkReferences } = require("./linker")
const YaxonNode = require('./YaxonNode')

const Kind = lexer.Kind

function parse(text) {
    const p = new Parser(text)
    const ast = p.parseAssignment()

    return linkReferences(ast)
 }

class Parser {
    constructor(text) {
        this.tokens = lexer.getTokens(text)[Symbol.iterator]()
        this.itState = this.tokens.next()
    }

    parseAssignment() {
        const token = this._peek(Kind.DOLLAR, Kind.NUMBER, Kind.STRING, Kind.LEFT_BRACKET, Kind.LEFT_BRACE)
        if (token.kind == Kind.DOLLAR) {
            this._match(Kind.DOLLAR)
            const id = this._match(Kind.STRING)
            if (this._peek().kind === Kind.EQUALS) {
                this._match(Kind.EQUALS)
                const node = this.parseTaggedNode()
                return new YaxonNode({ ...node, vardef: id.value })
            } else {
                return new YaxonNode({ varref: id.value })
            }
        } else {
            return this.parseTaggedNode()
        }
    }

    parseTaggedNode() {
        const tagList = this.parseTagList()
        const node = this.parseNode()

        return new YaxonNode({ ...node, tags: tagList })
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

    parseNode() {
        const token = this._peek(Kind.NUMBER, Kind.STRING, Kind.LEFT_BRACKET, Kind.LEFT_BRACE)
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
            const key = this._match(Kind.NUMBER, Kind.STRING)
            this._match(Kind.COLON)
            const node = this.parseAssignment()

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