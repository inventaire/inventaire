import listings_ from '#controllers/listings/lib/listings'

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

export default {
  sanitization,
  controller,
  track: [ 'lists', 'creation' ]
}
