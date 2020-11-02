const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const items_ = require('./lib/items')
const addEntitiesData = require('./lib/export/add_entities_data')
const FormatItemRow = require('./lib/export/format_item_row')
const csvHeaderRow = require('./lib/export/csv_header_row')
const responses_ = __.require('lib', 'responses')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')

const sanitization = {
  format: {
    allowlist: [ 'csv' ]
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ reqUserId }) => {
    const { language } = req.user
    const responseText = csvHeaderRow + '\n'
    return items_.byOwner(reqUserId)
    .then(buildItemsRowsSequentially(responseText, language))
  })
  .then(responses_.SendText(res))
  .catch(error_.Handler(req, res))
}

const addEntitiesAndShelfData = async item => {
  item = await addEntitiesData(item)
  const shelves = await shelves_.byIds(item.shelves)
  item.shelfNames = shelves.map(shelf => shelf.name)

  return item
}

const buildItemsRowsSequentially = (responseText, lang) => items => {
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
