import { createListing } from '#controllers/listings/lib/listings'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {
    optional: true,
    default: [],
  },
}

async function controller (params: SanitizedParameters) {
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
