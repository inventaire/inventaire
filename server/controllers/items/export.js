const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const promises_ = __.require('lib', 'promises')
const items_ = require('./lib/items')
const addEntitiesData = require('./lib/export/add_entities_data')
const formatItemRow = require('./lib/export/format_item_row')

const sanitization = {
  format: {
    whitelist: [ 'csv' ]
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ reqUserId }) => {
    const { lang } = req.user
    return items_.byOwner(reqUserId)
    .then(promises_.map(addEntitiesData))
    .then(formatCsv(lang))
  })
  .then(responses_.SendText(res))
  .catch(error_.Handler(req, res))
}

const header = [
  'Item ID',
  'Edition URI',
  'ISBN-13',
  'ISBN-10',
  'Title',
  'Subtitle',
  'PublicationDate',
  'Cover',
  'Works URIs',
  'Works labels',
  'Works Series ordinals',
  'Authors URIs',
  'Authors labels',
  'Series URIs',
  'Series labels',
  'Genres URIs',
  'Genres labels',
  'Subjects URIs',
  'Subjects labels',
  'Publisher URIs',
  'Publisher label'
].join(',')

const formatCsv = lang => items => {
  const rows = items.map(formatItemRow(lang))
  return `${header}\n${rows.join('\n')}`
}
