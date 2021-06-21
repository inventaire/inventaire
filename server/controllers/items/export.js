const { sanitize } = require('lib/sanitize/sanitize')
const items_ = require('./lib/items')
const addEntitiesData = require('./lib/export/add_entities_data')
const FormatItemRow = require('./lib/export/format_item_row')
const csvHeaderRow = require('./lib/export/csv_header_row')
const responses_ = require('lib/responses')
const shelves_ = require('controllers/shelves/lib/shelves')

const sanitization = {
  format: {
    allowlist: [ 'csv' ]
  }
}

module.exports = async (req, res) => {
  const { reqUserId } = sanitize(req, res, sanitization)
  const { language } = req.user
  let responseText = csvHeaderRow + '\n'
  const items = await items_.byOwner(reqUserId)
  responseText = await buildItemsRowsSequentially(items, responseText, language)
  responses_.sendText(res, responseText)
}

const addEntitiesAndShelfData = async item => {
  item = await addEntitiesData(item)
  const shelves = await shelves_.byIds(item.shelves)
  item.shelfNames = shelves.map(shelf => shelf.name)
  return item
}

const buildItemsRowsSequentially = async (items, responseText, lang) => {
  const formatItemRow = FormatItemRow(lang)

  const sendNextBatch = async () => {
    if (items.length === 0) return responseText.trim()

    // Using batches of 10 items to reduce stress on entities APIs
    const nextBatch = items.splice(0, 10)
    const enrichedItems = await Promise.all(nextBatch.map(addEntitiesAndShelfData))
    const formattedItemsRows = enrichedItems.map(formatItemRow).join('\n')
    responseText += formattedItemsRows + '\n'
    return sendNextBatch()
  }

  return sendNextBatch()
}
