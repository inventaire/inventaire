const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const sanitize = require('lib/sanitize/sanitize')
const radio = require('lib/radio')

const sanitization = {
  ids: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(deleteByIds)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const deleteByIds = params => {
  const { ids, reqUserId } = params
  return items_.byIds(ids)
  .then(_.compact)
  .then(verifyOwnership(reqUserId))
  .then(items_.bulkDelete)
  .then(() => radio.emit('user:inventory:update', reqUserId))
}

const verifyOwnership = reqUserId => items => {
  for (const item of items) {
    if (item.owner !== reqUserId) {
      throw error_.new("user isn't item owner", 403, { reqUserId, itemId: item._id })
    }
  }
  return items
}
