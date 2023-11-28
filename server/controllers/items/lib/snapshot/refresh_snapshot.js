import { getInvUrisByClaim } from '#controllers/entities/lib/entities'
import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { assert_ } from '#lib/utils/assert_types'
import { info } from '#lib/utils/logs'
import buildSnapshot from './build_snapshot.js'
import { getWorkAuthorsAndSeries, getEditionGraphEntities } from './get_entities.js'
import { getDocData } from './helpers.js'

let saveSnapshotsInBatch
const importCircularDependencies = async () => {
  ({ saveSnapshotsInBatch } = await import('./snapshot.js'))
}
setImmediate(importCircularDependencies)

export async function refreshSnapshotFromDoc (changedEntityDoc) {
  const [ uri, type ] = getDocData(changedEntityDoc)
  if (!refreshTypes.includes(type)) return

  const label = `${uri} items snapshot refresh`

  info(`${label}: starting`)
  const ops = await getSnapshotsByType[type](uri)
  return saveSnapshotsInBatch(ops)
}

export async function refreshSnapshotFromUri (changedEntityUri) {
  return getEntityByUri({ uri: changedEntityUri })
  .then(refreshSnapshotFromDoc)
}

const multiWorkRefresh = relationProperty => async uri => {
  const uris = await getInvUrisByClaim(relationProperty, uri)
  const snapshots = await Promise.all(uris.map(getSnapshotsByType.work))
  return snapshots.flat()
}

const getSnapshotsByType = {
  edition: uri => {
    // Get all the entities docs required to build the snapshot
    return getEditionGraphEntities(uri)
    // Build common updated snapshot
    .then(getEditionSnapshot)
  },

  work: async uri => {
    const work = await getEntityByUri({ uri })
    const [ authors, series ] = await getWorkAuthorsAndSeries(work)
    const snapshots = await Promise.all([
      getWorkSnapshot(uri, work, authors, series),
      getEditionsSnapshots(uri, [ work ], authors, series),
    ])
    return snapshots.flat()
  },

  human: multiWorkRefresh('wdt:P50'),
  serie: multiWorkRefresh('wdt:P179'),
}

const refreshTypes = Object.keys(getSnapshotsByType)

function getWorkSnapshot (uri, work, authors, series) {
  assert_.string(uri)
  assert_.object(work)
  assert_.array(authors)
  assert_.array(series)
  return buildSnapshot.work(work, authors, series)
}

async function getEditionsSnapshots (uri, works, authors, series) {
  assert_.string(uri)
  assert_.array(works)
  assert_.array(authors)
  assert_.array(series)

  const uris = await getInvUrisByClaim('wdt:P629', uri)
  const res = await getEntitiesByUris({ uris })
  const editions = Object.values(res.entities)
  return Promise.all(editions.map(edition => {
    return getEditionSnapshot([ edition, works, authors, series ])
  }))
}

function getEditionSnapshot ([ edition, works, authors, series ]) {
  assert_.object(edition)
  assert_.array(works)
  assert_.array(authors)
  assert_.array(series)
  // Expects a formatted edition
  assert_.string(edition.uri)
  return buildSnapshot.edition(edition, works, authors, series)
}
