const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const searchUserItems = require('./lib/search_user_items')
const getInventoryAccessLevel = require('./lib/get_inventory_access_level')

const sanitization = {
  user: {},
  search: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(itemsSearch)
  .then(responses_.Wrap(res, 'items'))
  .catch(error_.Handler(req, res))
}

const itemsSearch = async ({ reqUserId, userId, search }) => {
  const accessLevel = await getInventoryAccessLevel(userId, reqUserId)
  return searchUserItems(search, { userId, accessLevel })
}
