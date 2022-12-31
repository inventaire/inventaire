import { normalizeIsbn } from 'lib/isbn/isbn'
import { prefixifyInv } from './prefix'

export default entity => {
  // Case when the entity document is a proper entity document
  // but has a more broadly recognized URI available, currently only an ISBN
  const { claims } = entity
  const invUri = prefixifyInv(entity._id)

  const isbn = claims && claims['wdt:P212'] && claims['wdt:P212'][0]

  // Those URIs are aliases but, when available, always use the canonical id,
  // that is, in the only current, the ISBN
  // By internal convention, ISBN URIs are without hyphen
  return isbn ? `isbn:${normalizeIsbn(isbn)}` : invUri
}
