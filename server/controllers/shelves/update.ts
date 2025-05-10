import { updateShelfAttributes } from '#controllers/shelves/lib/shelves'
import { checkSpamContent } from '#controllers/user/lib/spam'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {
  shelf: {},
  description: { optional: true },
  visibility: { optional: true },
  name: { optional: true },
  color: { optional: true },
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  await checkSpamContent(req.user, params.description)
  const shelf = await updateShelfAttributes(params)
  return { shelf }
}

export default {
  sanitization,
  controller,
  track: [ 'shelf', 'update' ],
}
