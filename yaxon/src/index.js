const { parse, join } = require('./parser')
const { stringify } = require('./stringifier')

const YAXON = {
    parse,
    stringify,
    join
}

module.exports = YAXON