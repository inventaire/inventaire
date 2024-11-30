import { bulkItemsUpdate } from '#controllers/items/lib/bulk_update'
import { info } from '#lib/utils/logs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  ids: {},
  attribute: {},
  value: {},
}

async function controller (params: SanitizedParameters) {
  const { ids, attribute, value, reqUserId } = params
  info(params, 'bulk update')
  await bulkItemsUpdate({ ids, attribute, value, reqUserId })
  return { ok: true }
}

export default { sanitization, controller }
