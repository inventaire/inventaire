import { getEntitiesByIsbns } from '#controllers/entities/lib/get_entities_by_isbns'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { isWdEntityUri } from '#lib/boolean_validations'
import type { SanitizedResolverEntry } from '#server/types/resolver'
import { resolveExternalIds } from './resolve_external_ids.js'

export async function resolveEdition (entry: SanitizedResolverEntry) {
  const { isbn, claims } = entry.edition

  const [
    uriFoundByIsbn,
    matchingTriples,
  ] = await Promise.all([
    resolveByIsbn(isbn),
    resolveExternalIds(claims),
  ])
  // TODO: handle possible conflict between uriFoundByIsbn and urisFoundByExternalIds
  let uri
  if (uriFoundByIsbn) {
    uri = uriFoundByIsbn
  } else if (matchingTriples && matchingTriples.length === 1) {
    uri = matchingTriples[0].subject
    if (isWdEntityUri(uri)) {
      const entity = await getEntityByUri({ uri })
      // Get the canonical uri and check that the type is correct
      uri = entity.type === 'edition' ? entity.uri : null
    }
  }
  if (uri != null) entry.edition.uri = uri
  return entry
}

async function resolveByIsbn (isbn) {
  if (isbn == null) return
  const { entities } = await getEntitiesByIsbns([ isbn ], { autocreate: false, refresh: false })
  if (entities.length === 1) return entities[0].uri
}
