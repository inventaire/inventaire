import { map, zipObject } from 'lodash-es'
import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import type { Redirects } from '#controllers/entities/lib/get_entities_by_uris'
import { leveldbFactory } from '#db/level/get_sub_db'
import { newError } from '#lib/error/error'
import { checkIfCriticalEntitiesWereRemoved } from '#lib/federation/recover_critical_entities'
import { emit } from '#lib/radio'
import { objectEntries } from '#lib/utils/base'
import { info, logError } from '#lib/utils/logs'
import { objectKeys } from '#lib/utils/types'
import type { EntityUri, ExpandedSerializedEntity, SerializedEntity } from '#types/entity'

const db = leveldbFactory('entity-rev', 'utf8')

export async function updateEntitiesRevisionsCache (res: GetEntitiesByUrisResponse) {
  try {
    // Start by this check so that any recovered entity can be directly used by snapshots
    await checkIfCriticalEntitiesWereRemoved(res)
    // Problem: this still returns a removed:placeholder
    const { entities, redirects } = res
    const uris = objectKeys(entities)
    const cachedRevsByUris = await getCachedRevsByUris(uris, redirects)
    const updateOps = []
    for (const uri of uris) {
      const entity = entities[uri]
      const newRev = getEntityRevisionId(entity)
      const oldRev = cachedRevsByUris[uri]
      if (oldRev !== newRev) {
        updateOps.push({ type: 'put', key: uri, value: newRev })
        await emit('entity:changed', uri)
      }
    }
    for (const [ from, to ] of objectEntries(redirects)) {
      const oldRev = cachedRevsByUris[from]
      // Use the redirection target rev as the new rev value
      // Do not propagate redirection to items,
      // to not be impacted by an eventual merge revert
      const newRev = getEntityRevisionId(entities[to])
      if (oldRev !== newRev) {
        updateOps.push({ type: 'put', key: from, value: newRev })
        await emit('entity:changed', from)
      }
    }
    if (updateOps.length > 0) {
      info(`received new entities revisions: ${map(updateOps, 'key').join(' ')}`)
    }
    await db.batch(updateOps)
  } catch (err) {
    logError(err, 'updateEntitiesRevisionsCache error')
  }
}

async function getCachedRevsByUris (uris: EntityUri[], redirects: Redirects) {
  const redirectsUris = objectKeys(redirects)
  const allUris = uris.concat(redirectsUris)
  const cachedRevs: (string | undefined)[] = await db.getMany(allUris)
  return zipObject(allUris, cachedRevs)
}

function getEntityRevisionId (entity: SerializedEntity | ExpandedSerializedEntity) {
  if ('lastrevid' in entity) {
    let rev = entity.lastrevid.toString()
    if ('invRev' in entity) rev += `+${entity.invRev}`
    return rev
  } else if ('_rev' in entity) {
    return entity._rev
  } else {
    throw newError('entity revision id not found', 500, { entity })
  }
}
