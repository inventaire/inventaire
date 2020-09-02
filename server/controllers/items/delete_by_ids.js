const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const { refreshInventoryViews } = require('./lib/view/inventory_view')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const radio = __.require('lib', 'radio')

const sanitization = {
  ids: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(deleteByIds)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const deleteByIds = async params => {
  const { ids, reqUserId } = params
  const items = _.compact(await items_.byIds(ids))
  await verifyOwnership(reqUserId, items)
  await items_.bulkDelete(items)
  radio.emit('user:inventory:update', reqUserId)
  refreshInventoryViews({ usersIds: [ reqUserId ], items })
  return items
}

const verifyOwnership = (reqUserId, items) => {
  for (const item of items) {
    if (item.owner !== reqUserId) {
      throw error_.new("user isn't item owner", 403, { reqUserId, itemId: item._id })
    }
  }
  return items
}
