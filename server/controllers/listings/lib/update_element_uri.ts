import { without } from 'lodash-es'
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

export async function updateElementsUrisAfterMergeRevert (revertedUri: EntityUri, currentUri: EntityUri) {
  const elements = await getElementsByPreviousEntities([ revertedUri ])
  for (const element of elements) {
    if (element.uri === currentUri) {
      element.uri = revertedUri
      element.previousUris = without(element.previousUris, currentUri)
    }
  }
  return db.bulk(elements)
}
