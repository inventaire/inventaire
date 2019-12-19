const { pass, BoundedString } = require('./common')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  listing: listing => {
    return [ 'private', 'network', 'public' ].includes(listing)
  },
  name: BoundedString(0, 128)
}
