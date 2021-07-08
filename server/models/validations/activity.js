const { pass, BoundedString } = require('./common')
const allowTypes = [ 'Follow' ]

module.exports = {
  pass,
  type: type => allowTypes.includes(type),
  object: BoundedString(1, 256),
  externalId: BoundedString(1, 256),
  actor: BoundedString(1, 256)
}
