import { getEntitiesByIsbns } from '#controllers/entities/lib/get_entities_by_isbns'
import type { SanitizedResolverEntry } from '#server/types/resolver'
import { resolveExternalIds } from './resolve_external_ids.js'
// Do not try to resolve edition on Wikidata while Wikidata editions are in quarantine
// cf https://github.com/inventaire/inventaire/issues/182
const resolveOnWikidata = false

export async function resolveEdition (entry: SanitizedResolverEntry) {
  const { isbn, claims } = entry.edition

  return Promise.all([
    resolveByIsbn(isbn),
    resolveExternalIds(claims, { resolveOnWikidata }),
  ])
  .then(pickUriFromResolversResponses)
  .then(uri => {
    if (uri != null) { entry.edition.uri = uri }
    return entry
  })
}

async function resolveByIsbn (isbn) {
  if (isbn == null) return
  const { entities } = await getEntitiesByIsbns([ isbn ], { autocreate: false, refresh: false })
  if (entities.length === 1) return entities[0].uri
}

function pickUriFromResolversResponses ([ uriFoundByIsbn, urisFoundByExternalIds ]) {
  // TODO: handle possible conflict between uriFoundByIsbn and urisFoundByExternalIds
  if (uriFoundByIsbn) return uriFoundByIsbn
  if (urisFoundByExternalIds && urisFoundByExternalIds.length === 1) {
    return urisFoundByExternalIds[0]
  }
}
