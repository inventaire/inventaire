import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { isWdEntityUri } from '#lib/boolean_validations'
import { toIsbn13h } from '#lib/isbn/isbn'
import type { SanitizedResolverEntry } from '#server/types/resolver'
import { resolveExternalIds } from './resolve_external_ids.js'

export async function resolveEdition (entry: SanitizedResolverEntry) {
  const { isbn, claims } = entry.edition

  if (isbn) {
    const isbn13h = toIsbn13h(isbn)
    if (isbn13h) claims['wdt:P212'] = [ isbn13h ]
  }

  const matchingTriples = await resolveExternalIds(claims)
  if (!matchingTriples) return

  let uri
  if (matchingTriples.length === 1) {
    uri = matchingTriples[0].subject
    if (isWdEntityUri(uri)) {
      const entity = await getEntityByUri({ uri })
      // Get the canonical uri and check that the type is correct
      uri = entity.type === 'edition' ? entity.uri : null
    }
  }

  if (uri != null) entry.edition.uri = uri
}
