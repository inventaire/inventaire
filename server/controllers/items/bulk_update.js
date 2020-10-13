const __ = require('config').universalPath
const sanitize = __.require('lib', 'sanitize/sanitize')
const items_ = __.require('controllers', 'items/lib/items')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const { tap } = __.require('lib', 'promises')

const sanitization = {
  ids: {},
  attribute: {},
  value: { type: 'string' }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(tap(validateAttributes))
  .then(items_.bulkUpdate)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const validateAttributes = ({ attribute }) => {
  // bulk update cannot update collections values of some attributes
  // as there is no way to know what to do with the values (ie. add it, remove it)
  // Known attributes : shelves
  if (attribute === 'shelves') {
    let errorMessage = 'invalid attribute'
    errorMessage += ': use /api/shelves?action=add-items or /api/shelves?action=remove-items instead'
    throw error_.new(errorMessage, 400, attribute)
  }
}
