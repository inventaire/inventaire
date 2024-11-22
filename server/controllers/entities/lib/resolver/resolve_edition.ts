import { map } from 'lodash-es'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { toIsbn13h } from '#lib/isbn/isbn'
import { warn } from '#lib/utils/logs'
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
  if (matchingTriples.length > 0) {
    const uris = map(matchingTriples, 'subject')
    // Get the canonical uri
    const subjectEntities = await getEntitiesList(uris)
    // and check that the type is correct
    const matchingEditions = subjectEntities.filter(entity => entity.type === 'edition')
    if (matchingEditions.length === 1) {
      const entity = matchingEditions[0]
      uri = entity.uri
    } else {
      const context = {
        matchingTriples,
        matchingEditions: map(matchingEditions, 'uri'),
      }
      // TODO: create merge tasks
      warn(context, 'Too many matching editions found')
    }
  }

  if (uri != null) entry.edition.uri = uri
}
