// Links together the references in the file.

function linkReferencesnew(ast, variables) {
    const result = {}
    variables = variables || {}

}

function linkReferences(ast) {
    const variables = {}

    // findVariableDefinitions(ast, variables)
//    fillVariableReferences(ast, variables)

    const newAst = findVariables(ast, variables)
    const result = replaceReferences(newAst, variables)

    return result
}

function findVariables(ast, variables) {
    let newNode

    if (ast.varref) {
        return ast
    }

    const newTags = []
    if (ast.tags) {
        for (const tag of ast.tags) {
            const newArgs = {}
            for (const [key, value] of Object.entries(tag.args)) {
                newArgs[key] = findVariables(value, variables)
            }
            newTags.push({ id: tag.id, args: newArgs })
        }
    }

    if (typeof(ast.nodes) === "object") {
        if (Array.isArray(ast.nodes)) {
            const array = []
            for (const entry of ast.nodes) {
                array.push(findVariables(entry, variables))
            }
            newNode = new Lazy(array)
        } else {
            const obj = {}
            for (const [key, value] of Object.entries(ast.nodes)) {
                obj[key] = findVariables(value, variables)
            }
            newNode = new Lazy(obj)
        }
    } else {
        newNode = { value: ast.value }
    }

    if (ast.tags) {
        newNode.tags = newTags
    }

    if (ast.vardef) {
        variables[ast.vardef] = newNode
    }

    return newNode
}

class Lazy {
    constructor(nodesOrFunc) {
        this.nodes = nodesOrFunc
        this._value = undefined
    }

    get value() {
        if (this._value !== undefined) {
            return this._value
        }

        if (Array.isArray(this.nodes)) {
            this._value = []
            for (let i = 0; i < this.nodes.length; i++) {
                this._value[i] = this.nodes[i].value                
            }
            return this._value
        } else {
            this._value = {}
            for (const [key, node] of Object.entries(this.nodes)) {
                this._value[key] = node.value
            }
            return this._value            
        }
    }
}

function replaceReferences(ast, variables) {
    let newNode = ast

    if (ast.varref) {
        return variables[ast.varref]
    }

    if (ast.tags) {
        for (const tag of ast.tags) {
            for (const [key, value] of Object.entries(tag.args)) {
                tag.args[key] = replaceReferences(value, variables)
            }
        }
    }

    if (typeof(ast.nodes) === "object") {
        if (Array.isArray(ast.nodes)) {
            const newNodes = []
            for (const entry of ast.nodes) {
                newNodes.push(replaceReferences(entry, variables))
            }
            ast.nodes = newNodes
        } else {
            const newNodes = {}
            for (const [key, value] of Object.entries(ast.nodes)) {
                newNodes[key] = replaceReferences(value, variables)
            }
            ast.nodes = newNodes
        }
    }

    return newNode
}

function resolveTagReferences(tag, variables, visited) {
    const args = {}
    for (const [key, value] of Object.entries(tag.args)) {
        resolveReferences(value, variables, visited)
        
        tag.args[key] = value.value
    }
    return args
}

function hasOwnProperty(o, p) {
    return Object.prototype.hasOwnProperty.bind(o)(p)
}

function resolveReferences(ast, variables, visited) {
    visited = visited || new Set()

    if (visited.has(ast)) {
        return
    } else {
        visited.add(ast)
    }

    if (ast.tags) {
        for (const tag of ast.tags) {
            resolveTagReferences(tag, variables, visited)
        }
    }

    if (hasOwnProperty(ast, 'value')) {
        return
    }
    
    if (ast.nodes && typeof(ast.nodes) === "object") {
        if (Array.isArray(ast.nodes)) {
            Object.defineProperty(ast, 'value', { get: () => resolveArrayReferences(ast, variables, visited), configurable: true})
        } else {
            Object.defineProperty(ast, 'value', { get: () => resolveObjectReferences(ast, variables, visited), configurable: true})
        }
    } else {
        if (ast.varref) {
            const resolved = variables[ast.varref]
            Object.defineProperty(ast, 'value', { get: () => resolved.value, configurable: true })
        }
    }
}

function resolveArrayReferences(ast, variables, visited) {
    const result = []
    for (const el of ast.nodes) {
        resolveReferences(el, variables, visited)
        result.push(el.value)
    }
    ast.value = result
    return result
}

function resolveObjectReferences(ast, variables, visited) {
    const result = {}
    for (const [key, node] of Object.entries(ast.nodes)) {
        resolveReferences(node, variables, visited)
        result[key] = node.value
    }
    ast.value = result
    return result
}

module.exports = {
    linkReferences
}