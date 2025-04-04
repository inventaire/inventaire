import { map, zipObject } from 'lodash-es'
import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import type { Redirects } from '#controllers/entities/lib/get_entities_by_uris'
import { propagateRedirectionToSocialCore } from '#controllers/entities/lib/propagate_redirection'
import { subscribeToCrossInstanceEvent } from '#controllers/instances/lib/subscribe'
import { leveldbFactory } from '#db/level/get_sub_db'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { objectEntries } from '#lib/utils/base'
import { info, logError } from '#lib/utils/logs'
import { objectKeys } from '#lib/utils/types'
import type { EntityUri, MaybeExpandedSerializedEntity } from '#types/entity'

const db = leveldbFactory('entity-rev', 'utf8')

export async function updateEntitiesRevisionsCache (res: GetEntitiesByUrisResponse, emitter?: string) {
  try {
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
        await emit('entity:changed', uri, emitter)
      }
    }
    if (updateOps.length > 0) {
      info(`received new entities revisions: ${map(updateOps, 'key').join(' ')}`)
    }
    for (const [ from, to ] of objectEntries(redirects)) {
      await propagateRedirectionAndSubscribeToRevertEvent(from, to)
      updateOps.push({ type: 'del', key: from })
    }
    await db.batch(updateOps)
  } catch (err) {
    logError(err, 'updateEntitiesRevisionsCache error')
  }
}

async function propagateRedirectionAndSubscribeToRevertEvent (from: EntityUri, to: EntityUri) {
  await propagateRedirectionToSocialCore(from, to)
  await subscribeToCrossInstanceEvent('revert-merge', from)
}

async function getCachedRevsByUris (uris: EntityUri[], redirects: Redirects) {
  const redirectsUris = objectKeys(redirects)
  const allUris = uris.concat(redirectsUris)
  const cachedRevs: (string | undefined)[] = await db.getMany(allUris)
  return zipObject(allUris, cachedRevs)
}

function getEntityRevisionId (entity: MaybeExpandedSerializedEntity) {
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
