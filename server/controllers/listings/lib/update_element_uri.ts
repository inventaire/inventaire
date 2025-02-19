import { getElementsByEntities, getElementsByPreviousEntities } from '#controllers/listings/lib/elements'
import { dbFactory } from '#db/couchdb/base'
import type { EntityUri } from '#types/entity'

const db = await dbFactory('elements')

export async function updateElementsUrisAfterMerge (currentUri: EntityUri, newUri: EntityUri) {
  const elements = await getElementsByEntities([ currentUri ])
  for (const element of elements) {
    element.uri = newUri
    // Keeping track of previous entity URI in case of a revert merge
    element.previousUris ??= []
    element.previousUris.unshift(currentUri)
  }
  return db.bulk(elements)
}

export async function updateElementsUrisAfterMergeRevert (revertedUri: EntityUri) {
  const elements = await getElementsByPreviousEntities([ revertedUri ])
  for (const element of elements) {
    element.uri = revertedUri
    // Keep only the uris associated to that element before the currently reverted merge,
    // in the rather unlikely case (but seen to happen in prod) were an entity was redirected several times
    const revertedUriIndex = element.previousUris.indexOf(revertedUri)
    element.previousUris = element.previousUris.splice(revertedUriIndex + 1)
    if (element.previousUris.length === 0) delete element.previousUris
  }
  return db.bulk(elements)
}
