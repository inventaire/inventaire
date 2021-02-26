const { boolean, geoPoint, text } = require('./mappings_datatypes')

module.exports = {
  properties: {
    name: text,
    description: text,
    searchable: boolean,
    position: geoPoint,
  }
}
