const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const error_ = require('lib/error/error')
const { emit } = require('lib/radio')

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

module.exports = { sanitization, controller }
