import entities_ from '../entities.js'
import getInvEntityCanonicalUri from '../get_inv_entity_canonical_uri.js'
import resolveExternalIds from './resolve_external_ids.js'
// Do not try to resolve edition on Wikidata while Wikidata editions are in quarantine
// cf https://github.com/inventaire/inventaire/issues/182
const resolveOnWikidata = false

export default entry => {
  const { isbn, claims } = entry.edition

  return Promise.all([
    resolveByIsbn(isbn),
    resolveExternalIds(claims, resolveOnWikidata)
  ])
  .then(pickUriFromResolversResponses)
  .then(uri => {
    if (uri != null) { entry.edition.uri = uri }
    return entry
  })
}

const resolveByIsbn = async isbn => {
  if (isbn == null) return
  // Resolve directly on the database to avoid making undersired requests to dataseed
  const edition = await entities_.byIsbn(isbn)
  if (edition != null) return getInvEntityCanonicalUri(edition)
}

const pickUriFromResolversResponses = ([ uriFoundByIsbn, urisFoundByExternalIds ]) => {
  // TODO: handle possible conflict between uriFoundByIsbn and urisFoundByExternalIds
  if (uriFoundByIsbn) return uriFoundByIsbn
  if (urisFoundByExternalIds && urisFoundByExternalIds.length === 1) {
    return urisFoundByExternalIds[0]
  }
}
