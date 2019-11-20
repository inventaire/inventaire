const __ = require('config').universalPath
const sanitize = __.require('lib', 'sanitize/sanitize')
const items_ = __.require('controllers', 'items/lib/items')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')

const sanitization = {
  ids: {},
  attribute: {},
  value: {}
}

module.exports = (req, res, next) => {
  const reqUserId = req.user._id

  sanitize(req, res, sanitization)
  .then(params => {
    const { ids, attribute, value } = params
    return items_.bulkUpdate(reqUserId, ids, attribute, value)
    .then(responses_.Ok(res))
  })
  .catch(error_.Handler(req, res))
}
