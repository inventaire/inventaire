const { bulkItemsUpdate } = require('controllers/items/lib/bulk_update')
const error_ = require('lib/error/error')

const sanitization = {
  ids: {},
  attribute: {},
  value: {}
}

const controller = async params => {
  validateAttributes(params.attribute)
  await bulkItemsUpdate(params)
  return { ok: true }
}

const validateAttributes = attribute => {
  // Shelves have a dedicated update endpoint, which allows
  // to add and remove shelves from items arrays without
  // requiring that all the updated items end up with the same shelves
  if (attribute === 'shelves') {
    let errorMessage = 'invalid attribute'
    errorMessage += ': use /api/shelves?action=add-items or /api/shelves?action=remove-items instead'
    throw error_.new(errorMessage, 400, attribute)
  }
}

module.exports = { sanitization, controller }
