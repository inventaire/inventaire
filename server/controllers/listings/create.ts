import { createListing } from '#controllers/listings/lib/listings'
import listingAttributes from '#models/attributes/listing'

const { type: listingTypes } = listingAttributes

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {
    optional: true,
    default: [],
  },
  type: {
    allowlist: listingTypes,
  },
}

async function controller (params) {
  const listing = await formatNewListing(params)
  return { list: listing }
}

function formatNewListing (params) {
  const { name, description, visibility, type, reqUserId: creator } = params
  const listingData = {
    name,
    description,
    visibility,
    creator,
    type,
  }
  return createListing(listingData)
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'creation' ],
}
