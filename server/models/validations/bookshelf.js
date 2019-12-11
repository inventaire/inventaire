const { pass, BoundedString } = require('./common')

const attributes = require('../attributes/bookshelf')

module.exports = {
  pass,
  description: BoundedString(0, 5000),
  listing: listing => {
    return attributes.listing.possibilities.includes(listing)
  },
  name: BoundedString(0, 128)
}
