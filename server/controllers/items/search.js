const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const searchUserItems = require('./lib/search_user_items')

const sanitization = {
  user: {},
  search: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(search)
  .then(responses_.Wrap(res, 'items'))
  .catch(error_.Handler(req, res))
}

const search = async ({ reqUserId, userId, search }) => {
  return searchUserItems(search, { userId })
}
