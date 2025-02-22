import { map, uniq } from 'lodash-es'
import { getEntitiesByUris, getEntityByUri, getReverseClaims } from '#controllers/entities/lib/federation/instance_agnostic_entities'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import { saveSnapshotsInBatch } from '#controllers/items/lib/snapshot/snapshot'
import { debounceByKey } from '#lib/debounce_by_key'
import { info, warn } from '#lib/utils/logs'
import config from '#server/config'
import type { EntityUri, InvEntityDoc, PropertyUri, SerializedEntity } from '#types/entity'
import buildSnapshot from './build_snapshot.js'
import { getWorkAuthorsAndSeries, getEditionGraphEntities } from './get_entities.js'
import { getEntityUriAndType } from './helpers.js'

const { snapshotsDebounceTime } = config

async function refreshSnapshotFromEntity (changedEntityDoc: InvEntityDoc | SerializedEntity) {
  const { uri, type } = getEntityUriAndType(changedEntityDoc)
  if (!refreshTypes.includes(type)) return

  info(`items snapshot refresh: start from ${uri}`)
  const ops = await getSnapshotsByType[type](uri)
  info(`items snapshot refresh: started from ${uri}, saving: ${map(ops, 'key').join('|')}`)
  return saveSnapshotsInBatch(ops)
}

export async function refreshSnapshotFromUri (changedEntityUri: EntityUri) {
  const entity = await getEntityByUri({ uri: changedEntityUri })
  if (entity) {
    return refreshSnapshotFromEntity(entity)
  } else {
    warn({ changedEntityUri }, 'cannot refresh snapshot: entity not found')
  }
}

export const lazyRefreshSnapshotFromUri = debounceByKey(refreshSnapshotFromUri, snapshotsDebounceTime)

export function lazyRefreshSnapshotFromEntity (changedEntityDoc: InvEntityDoc | SerializedEntity) {
  const { uri } = getEntityUriAndType(changedEntityDoc)
  lazyRefreshSnapshotFromUri(uri)
}

const multiWorkRefresh = (relationProperties: PropertyUri[]) => async (uri: EntityUri) => {
  const urisArrays = await Promise.all(relationProperties.map(property => {
    return getReverseClaims({ property, value: uri })
  }))
  const uris = uniq(urisArrays.flat())
  const snapshots = await Promise.all(uris.map(getSnapshotsByType.work))
  return snapshots.flat()
}

const getSnapshotsByType = {
  edition: async (uri: EntityUri) => {
    // Get all the entities docs required to build the snapshot
    const [ edition, works, authors, series ] = await getEditionGraphEntities(uri)
    // Build common updated snapshot
    return buildSnapshot.edition(edition, works, authors, series)
  },

  work: async (uri: EntityUri) => {
    const work = await getEntityByUri({ uri })
    const [ authors, series ] = await getWorkAuthorsAndSeries(work)
    const snapshots = await Promise.all([
      getWorkSnapshot(work, authors, series),
      getEditionsSnapshots(uri, [ work ], authors, series),
    ])
    return snapshots.flat()
  },

  human: multiWorkRefresh(workAuthorRelationsProperties),
  serie: multiWorkRefresh([ 'wdt:P179' ]),
}

const refreshTypes = Object.keys(getSnapshotsByType)

function getWorkSnapshot (work: SerializedEntity, authors: SerializedEntity[], series: SerializedEntity[]) {
  return buildSnapshot.work(work, authors, series)
}

async function getEditionsSnapshots (workUri: EntityUri, works: SerializedEntity[], authors: SerializedEntity[], series: SerializedEntity[]) {
  const editionsUris = await getReverseClaims({ property: 'wdt:P629', value: workUri })
  const { entities } = await getEntitiesByUris({ uris: editionsUris })
  const editions = Object.values(entities)
  return Promise.all(editions.map(edition => {
    return buildSnapshot.edition(edition, works, authors, series)
  }))
}
