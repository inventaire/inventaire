import { createListing } from '#controllers/listings/lib/listings'

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {
    optional: true,
    default: [],
  },
}

async function controller (params) {
  const listing = await formatNewListing(params)
  return { list: listing }
}

function formatNewListing (params) {
  const { name, description, visibility, reqUserId: creator } = params
  const listingData = {
    name,
    description,
    visibility,
    creator,
  }
  return createListing(listingData)
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'creation' ],
}
