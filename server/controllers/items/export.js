import { sanitize, validateSanitization } from '#lib/sanitize/sanitize'
import responses_ from '#lib/responses'
import shelves_ from '#controllers/shelves/lib/shelves'
import items_ from './lib/items.js'
import addEntitiesData from './lib/export/add_entities_data.js'
import FormatItemRow from './lib/export/format_item_row.js'
import csvHeaderRow from './lib/export/csv_header_row.js'

const sanitization = validateSanitization({
  format: {
    allowlist: [ 'csv' ]
  }
})

export default async (req, res) => {
  const { reqUserId } = sanitize(req, res, sanitization)
  const { language } = req.user
  let responseText = csvHeaderRow + '\n'
  const items = await items_.byOwner(reqUserId)
  responseText = await buildItemsRowsSequentially(items, responseText, language)
  res.header('content-type', 'text/csv')
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
