const { bulkItemsUpdate } = require('controllers/items/lib/bulk_update')
const { info } = require('lib/utils/logs')

const sanitization = {
  ids: {},
  attribute: {},
  value: {}
}

const controller = async params => {
  info(params, 'bulk update')
  await bulkItemsUpdate(params)
  return { ok: true }
}

module.exports = { sanitization, controller }
