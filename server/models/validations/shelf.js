const { pass, BoundedString, userId } = require('./common')
const { isColorHexCode } = require('lib/boolean_validations')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  listing: listing => {
    return [ 'private', 'network', 'public' ].includes(listing)
  },
  owner: userId,
  name: BoundedString(0, 128),
  color: isColorHexCode
}
