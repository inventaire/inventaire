import { bulkItemsUpdate } from '#controllers/items/lib/bulk_update'
import { info } from '#lib/utils/logs'

const sanitization = {
  ids: {},
  attribute: {},
  value: {},
}

async function controller (params) {
  info(params, 'bulk update')
  await bulkItemsUpdate(params)
  return { ok: true }
}

export default { sanitization, controller }
