const { normalizeIsbn } = require('lib/isbn/isbn')
const formatEntityCommon = require('./format_entity_common')

module.exports = entity => {
  const isbn = entity.claims['wdt:P212'][0]
  entity.uri = `isbn:${normalizeIsbn(isbn)}`
  entity.type = 'edition'
  return formatEntityCommon(entity)
}
