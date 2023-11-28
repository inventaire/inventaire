import { chain, compact } from 'lodash-es'
import { getInvEntitiesByClaimsValue, getEntityById, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { removePlaceholder } from '#controllers/entities/lib/placeholders'
import { assert_ } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import Entity from '#models/entity'
import propagateRedirection from './propagate_redirection.js'

export default async ({ userId, fromId, toUri, previousToUri, context }) => {
  assert_.strings([ userId, fromId, toUri ])
  if (previousToUri != null) assert_.string(previousToUri)

  const fromUri = `inv:${fromId}`

  const currentFromDoc = await getEntityById(fromId)
  Entity.preventRedirectionEdit(currentFromDoc, 'turnIntoRedirection')
  // If an author has no more links to it, remove it
  const removedIds = await removeObsoletePlaceholderEntities(userId, currentFromDoc)
  const updatedFromDoc = Entity.turnIntoRedirection(currentFromDoc, toUri, removedIds)
  await putInvEntityUpdate({
    userId,
    currentDoc: currentFromDoc,
    updatedDoc: updatedFromDoc,
    context,
  })
  return propagateRedirection(userId, fromUri, toUri, previousToUri)
}

// Removing the entities that were needed only by the entity about to be turned
// into a redirection: this entity now don't have anymore reason to be and is quite
// probably a duplicate of an existing entity referenced by the redirection
// destination entity.
const removeObsoletePlaceholderEntities = async (userId, entityDocBeforeRedirection) => {
  const entityUrisToCheck = getEntityUrisToCheck(entityDocBeforeRedirection.claims)
  log(entityUrisToCheck, 'entityUrisToCheck')
  const fromId = entityDocBeforeRedirection._id
  const removedIds = await Promise.all(entityUrisToCheck.map(deleteIfIsolated(userId, fromId)))
  return compact(removedIds)
}

const getEntityUrisToCheck = claims => {
  return chain(claims)
  .pick(propertiesToCheckForPlaceholderDeletion)
  .values()
  // Merge properties arrays
  .flatten()
  .uniq()
  .value()
}

const propertiesToCheckForPlaceholderDeletion = [
  // author
  'wdt:P50',
]

const deleteIfIsolated = (userId, fromId) => async entityUri => {
  const [ prefix, entityId ] = entityUri.split(':')
  // Ignore wd or isbn entities
  if (prefix !== 'inv') return

  let results = await getInvEntitiesByClaimsValue(entityUri)
  results = results.filter(result => result.entity !== fromId)
  if (results.length === 0) return removePlaceholder(userId, entityId)
}
