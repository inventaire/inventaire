const { geoPoint, text } = require('./mappings_datatypes')

module.exports = {
  properties: {
    username: text,
    bio: text,
    position: geoPoint,
  }
}
