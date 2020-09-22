const __ = require('config').universalPath
const sanitize = __.require('lib', 'sanitize/sanitize')
const items_ = __.require('controllers', 'items/lib/items')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')

const sanitization = {
  ids: {},
  attribute: {},
  value: { type: 'string' }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(items_.bulkUpdate)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}
