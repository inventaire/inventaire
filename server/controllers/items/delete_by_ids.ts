import { compact } from 'lodash-es'
import { getItemsByIds, itemsBulkDelete } from '#controllers/items/lib/items'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  ids: {},
}

async function controller ({ ids, reqUserId }: SanitizedParameters) {
  await getItemsByIds(ids)
  .then(compact)
  .then(verifyOwnership(reqUserId))
  .then(itemsBulkDelete)

  await emit('user:inventory:update', reqUserId)

  return { ok: true }
}

const verifyOwnership = reqUserId => items => {
  for (const item of items) {
    if (item.owner !== reqUserId) {
      throw newError("user isn't item owner", 403, { reqUserId, itemId: item._id })
    }
  }
  return items
}

export default { sanitization, controller }
