const listings_ = require('controllers/listings/lib/listings')

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {
    optional: true,
    default: []
  },
}

const controller = async params => {
  const listing = await formatNewListing(params)
  return { list: listing }
}

const formatNewListing = params => {
  const { name, description, visibility, reqUserId: creator } = params
  const listingData = {
    name,
    description,
    visibility,
    creator,
  }
  return listings_.create(listingData)
}

module.exports = {
  sanitization,
  controller,
  track: [ 'lists', 'creation' ]
}
