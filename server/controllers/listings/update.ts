import { updateListingAttributes } from '#controllers/listings/lib/listings'
import { checkSpamContent } from '#controllers/user/lib/spam'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {
  id: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { user } = req
  const { name, description } = params
  await checkSpamContent(user, name, description)
  const listing = await updateListingAttributes(params)
  return { list: listing }
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'update' ],
}
