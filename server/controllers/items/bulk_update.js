const { bulkItemsUpdate } = require('controllers/items/lib/bulk_update')

const sanitization = {
  ids: {},
  attribute: {},
  value: {}
}

const controller = async params => {
  await bulkItemsUpdate(params)
  return { ok: true }
}

module.exports = { sanitization, controller }
