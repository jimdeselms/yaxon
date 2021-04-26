const { parse, joinDocs } = require('./parser')
const { stringify } = require('./stringifier')

const YAXON = {
    parse,
    stringify,
    join: joinDocs
}

module.exports = YAXON