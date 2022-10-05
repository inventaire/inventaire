const { isVisibilityKeyArray } = require('models/validations/visibility')
const { pass, BoundedString, userId } = require('./common')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  visibility: isVisibilityKeyArray,
  creator: userId,
  name: BoundedString(0, 128),
}
