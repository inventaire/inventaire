const items_ = require('controllers/items/lib/items')
const error_ = require('lib/error/error')

const sanitization = {
  ids: {},
  attribute: {},
  value: { type: 'string' }
}

const controller = async params => {
  validateAttributes(params.attribute)
  await items_.bulkUpdate(params)
  return { ok: true }
}

const validateAttributes = attribute => {
  // bulk update cannot update collections values of some attributes
  // as there is no way to know what to do with the values (ie. add it, remove it)
  // Known attributes : shelves
  if (attribute === 'shelves') {
    let errorMessage = 'invalid attribute'
    errorMessage += ': use /api/shelves?action=add-items or /api/shelves?action=remove-items instead'
    throw error_.new(errorMessage, 400, attribute)
  }
}

module.exports = { sanitization, controller }
