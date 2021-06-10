const { pass, BoundedString } = require('./common')
const allowTypes = [ 'Follow' ]

module.exports = {
  pass,
  type: type => allowTypes.includes(type),
  object: BoundedString(0, 256),
  externalId: BoundedString(0, 256),
  actor: BoundedString(0, 256)
}
