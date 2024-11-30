import { updateListingAttributes } from '#controllers/listings/lib/listings'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  id: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
}

async function controller (params: SanitizedParameters) {
  const listing = await updateListingAttributes(params)
  return { list: listing }
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'update' ],
}
