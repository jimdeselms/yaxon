/*
 * What are all the possible attributes on a YaxonNode?
 * nodes: if it's an array or object
 * value: if it's a scalar type
 * vardef: if they define the value of a variable
 * varref: if they're referencing a variable
 * amend: they're merging this node with another node.
 * tags: the set of tags on this node.
 */

const YaxonNode = require("./YaxonNode")

function join(node1, node2) {
    if (node1 === null || node2 === null) {
        return node1 || node2
    }

    const result = joinNodes(node1, node2)

    result.amendments = [...node1.amendments || [], node2.amendments || []]

    return result
}

function joinNodes(node1, node2) {
    // Just combine the tags
    const result  = { tags: [...node1.tags || [], ...node2.tags || []] }

    const node1Vardef = node1.vardef
    const node2Vardef = node2.vardef
    if (node1Vardef && node2Vardef) {
        // Maybe we can support this in the future?
        throw new Error("Cannnot merge two nodes with variable definitions")
    } else if (node1Vardef || node2Vardef) {
        result.vardef = node1Vardef || node2Vardef
    }

    const node1Varref = node1.varref
    const node2Varref = node2.varref
    if (node1Varref && node2Varref && node1Varref !== node2Varref) {
        throw new Error("Cannot merge two nodes with different variable refereces")
    }

    if (node1.nodes && node2.nodes) {
        const nodes = joinObjectsOrArrays(node1.nodes, node2.nodes)
        result.nodes = nodes
    } else if (node1.value !== undefined && node1.value !== null && node2.value !== undefined && node2.value !== undefined) {
        if (node1.value !== node2.value) {
            throw new Error("Cannot merge two different values")
        }
        result.value = node1.value
    } else if (node1.varref && node2.varref) {
        if (node1.varref !== node2.varref) {
            throw new Error("Cannot merge nodes with two different variable references")
        }
        result.varref = node1.varref
    } else if (node1.varref && node2.vardef) {
        if (node1.varref !== node2.vardef) {
            throw new Error("Cannot merge variable reference and variable definition if they are not the same variable")
        }
        result.vardef = node2.vardef
        if (node2.value !== undefined) {
            result.value = node2.value
        } else {
            result.nodes = node2.nodes
        }
    } else if (node1.vardef && node2.varref) {
        if (node1.vardef !== node2.varref) {
            throw new Error("Cannot merge variable reference and variable definition if they are not the same variable")
        }
        result.vardef = node1.vardef
        if (node1.value !== undefined) {
            result.value = node1.value
        } else {
            result.nodes = node1.nodes
        }
    }

    return new YaxonNode(result)    
}

function joinObjectsOrArrays(nodes1, nodes2) {
    if (Array.isArray(nodes1) !== Array.isArray(nodes2)) {
        throw new Error("Cannot merge an array with a non-array")
    } else if (Array.isArray(nodes1)) {
        return [...nodes1, ...nodes2]
    } else {
        const newNodes = {}
        for (const [key, value] of Object.entries(nodes1)) {
            const other = nodes2[key]
            if (other !== undefined) {
                newNodes[key] = joinNodes(value, other)
            } else {
                newNodes[key] = value
            }
        }

        for (const [key, value] of Object.entries(nodes2)) {
            if (nodes1[key] === undefined) {
                newNodes[key] = value
            }
        }

        return newNodes
    }
}

module.exports = {
    join
}