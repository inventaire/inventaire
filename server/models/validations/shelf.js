const { pass, BoundedString, userId } = require('./common')
const { isColorHexCode } = require('lib/boolean_validations')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  visibility: require('./visibility'),
  owner: userId,
  name: BoundedString(0, 128),
  color: isColorHexCode
}
