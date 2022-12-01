const { pass, BoundedString, userId } = require('./common')
const { isColorHexCode } = require('lib/boolean_validations')
const { isVisibilityKeyArray } = require('models/validations/visibility')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  visibility: isVisibilityKeyArray,
  owner: userId,
  name: BoundedString(0, 128),
  color: isColorHexCode
}
