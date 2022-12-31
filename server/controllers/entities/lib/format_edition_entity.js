import { normalizeIsbn } from 'lib/isbn/isbn'
import formatEntityCommon from './format_entity_common'

export default entity => {
  const isbn = entity.claims['wdt:P212'][0]
  entity.uri = `isbn:${normalizeIsbn(isbn)}`
  entity.type = 'edition'
  return formatEntityCommon(entity)
}
