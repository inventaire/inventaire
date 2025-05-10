import { bulkItemsUpdate } from '#controllers/items/lib/bulk_update'
import { checkSpamContent } from '#controllers/user/lib/spam'
import { info } from '#lib/utils/logs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {
  ids: {},
  attribute: {},
  value: {},
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { ids, attribute, value, reqUserId } = params
  info(params, 'bulk update')
  if (attribute === 'details') await checkSpamContent(req.user, value)
  await bulkItemsUpdate({ ids, attribute, value, reqUserId })
  return { ok: true }
}

export default { sanitization, controller }
