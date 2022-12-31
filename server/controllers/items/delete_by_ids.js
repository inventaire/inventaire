import _ from 'builders/utils'
import items_ from 'controllers/items/lib/items'
import error_ from 'lib/error/error'
import { emit } from 'lib/radio'

const sanitization = {
  ids: {}
}

const controller = async ({ ids, reqUserId }) => {
  await items_.byIds(ids)
  .then(_.compact)
  .then(verifyOwnership(reqUserId))
  .then(items_.bulkDelete)

  await emit('user:inventory:update', reqUserId)

  return { ok: true }
}

const verifyOwnership = reqUserId => items => {
  for (const item of items) {
    if (item.owner !== reqUserId) {
      throw error_.new("user isn't item owner", 403, { reqUserId, itemId: item._id })
    }
  }
  return items
}

export default { sanitization, controller }
