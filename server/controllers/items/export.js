const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const items_ = require('./lib/items')
const addEntitiesData = require('./lib/export/add_entities_data')
const FormatItemRow = require('./lib/export/format_item_row')
const csvHeaderRow = require('./lib/export/csv_header_row')
const responses_ = __.require('lib', 'responses')

const sanitization = {
  format: {
    whitelist: [ 'csv' ]
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ reqUserId }) => {
    const { lang } = req.user
    const responseText = csvHeaderRow + '\n'
    return items_.byOwner(reqUserId)
    .then(buildItemsRowsSequentially(responseText, lang))
  })
  .then(responses_.SendText(res))
  .catch(error_.Handler(req, res))
}

const buildItemsRowsSequentially = (responseText, lang) => items => {
  const formatItemRow = FormatItemRow(lang)

  const sendNextBatch = async () => {
    if (items.length === 0) return responseText

    // Using batches of 10 items to reduce stress on entities APIs
    const nextBatch = items.splice(0, 10)
    const enrichedItems = await Promise.all(nextBatch.map(addEntitiesData))
    const formattedItemsRows = enrichedItems.map(formatItemRow).join('\n')
    responseText += formattedItemsRows + '\n'
    return sendNextBatch()
  }

  return sendNextBatch()
}
