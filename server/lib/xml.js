const { promisify } = require('util')
const xml2js = require('xml2js')

module.exports = {
  parse: promisify(xml2js.parseString)
}
