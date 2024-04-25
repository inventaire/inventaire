import { getInvEntitiesUrisByClaims, getInvUrisByClaim } from '#controllers/entities/lib/entities'
import { getEntitiesByUris } from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import { saveSnapshotsInBatch } from '#controllers/items/lib/snapshot/snapshot'
import { info } from '#lib/utils/logs'
import type { EntityUri, InvEntityDoc, PropertyUri, SerializedEntity } from '#server/types/entity'
import buildSnapshot from './build_snapshot.js'
import { getWorkAuthorsAndSeries, getEditionGraphEntities } from './get_entities.js'
import { getEntityUriAndType } from './helpers.js'

export async function refreshSnapshotFromEntity (changedEntityDoc: InvEntityDoc | SerializedEntity) {
  const { uri, type } = getEntityUriAndType(changedEntityDoc)
  if (!refreshTypes.includes(type)) return

  info(`items snapshot refresh: start  ${uri}`)
  const ops = await getSnapshotsByType[type](uri)
  info(`items snapshot refresh: saving ${uri}`)
  return saveSnapshotsInBatch(ops)
}

export async function refreshSnapshotFromUri (changedEntityUri: EntityUri) {
  return getEntityByUri({ uri: changedEntityUri })
  .then(refreshSnapshotFromEntity)
}

const multiWorkRefresh = (relationProperties: readonly PropertyUri[]) => async (uri: EntityUri) => {
  const uris = await getInvEntitiesUrisByClaims(relationProperties, uri)
  const snapshots = await Promise.all(uris.map(getSnapshotsByType.work))
  return snapshots.flat()
}

const getSnapshotsByType = {
  edition: (uri: EntityUri) => {
    // Get all the entities docs required to build the snapshot
    return getEditionGraphEntities(uri)
    // Build common updated snapshot
    .then(getEditionSnapshot)
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

  human: multiWorkRefresh(authorRelationsProperties),
  serie: multiWorkRefresh([ 'wdt:P179' ]),
}

const refreshTypes = Object.keys(getSnapshotsByType)

function getWorkSnapshot (work: SerializedEntity, authors: SerializedEntity[], series: SerializedEntity[]) {
  return buildSnapshot.work(work, authors, series)
}

async function getEditionsSnapshots (uri: EntityUri, works: SerializedEntity[], authors: SerializedEntity[], series: SerializedEntity[]) {
  const uris = await getInvUrisByClaim('wdt:P629', uri)
  const res = await getEntitiesByUris({ uris })
  const editions = Object.values(res.entities)
  return Promise.all(editions.map(edition => {
    return getEditionSnapshot([ edition, works, authors, series ])
  }))
}

function getEditionSnapshot ([ edition, works, authors, series ]: [ SerializedEntity, SerializedEntity[], SerializedEntity[], SerializedEntity[] ]) {
  return buildSnapshot.edition(edition, works, authors, series)
}
