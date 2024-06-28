import { createListing } from '#controllers/listings/lib/listings'
import { checkSpamContent } from '#controllers/user/lib/spam'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {
  name: {},
  description: { optional: true },
  visibility: {
    optional: true,
    default: [],
  },
  type: {
    allowlist: [ 'work' ],
    optional: true,
    default: 'work',
  },
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  await checkSpamContent(req.user, params.description)
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
