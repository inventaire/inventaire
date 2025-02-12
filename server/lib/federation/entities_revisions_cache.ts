import { map } from 'lodash-es'
import type { GetEntitiesByUrisResponse } from '#controllers/entities/by_uris_get'
import { leveldbFactory } from '#db/level/get_sub_db'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { info, logError } from '#lib/utils/logs'
import { objectKeys } from '#lib/utils/types'
import type { ExpandedSerializedEntity, SerializedEntity } from '#types/entity'

const db = leveldbFactory('entity-rev', 'utf8')

export async function updateEntitiesRevisionsCache (res: GetEntitiesByUrisResponse) {
  try {
    const { entities } = res
    const uris = objectKeys(entities)
    const cacheRes: (string | undefined)[] = await db.getMany(uris)
    const updateOps = []
    for (const [ index, uri ] of uris.entries()) {
      const entity = entities[uri]
      const newRev = getEntityRevisionId(entity)
      const oldRev = cacheRes[index]
      if (oldRev !== newRev) {
        updateOps.push({ type: 'put', key: uri, value: newRev })
        await emit('entity:changed', uri)
      }
    }
    info(`received new entities revisions: ${map(updateOps, 'key').join(' ')}`)
    await db.batch(updateOps)
  } catch (err) {
    logError(err, 'updateEntitiesRevisionsCache error')
  }
}

function getEntityRevisionId (entity: SerializedEntity | ExpandedSerializedEntity) {
  if ('lastrevid' in entity) return entity.lastrevid.toString()
  else if ('_rev' in entity) return entity._rev
  else throw newError('entity revision id not found', 500, { entity })
}
