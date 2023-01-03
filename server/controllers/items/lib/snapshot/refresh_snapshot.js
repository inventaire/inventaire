import _ from '#builders/utils'
import { urisByClaim } from '#controllers/entities/lib/entities'
import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import getEntityByUri from '#controllers/entities/lib/get_entity_by_uri'
import { mappedArrayPromise } from '#lib/promises'
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

const fromDoc = changedEntityDoc => {
  const [ uri, type ] = getDocData(changedEntityDoc)
  if (!refreshTypes.includes(type)) return

  const label = `${uri} items snapshot refresh`

  info(`${label}: starting`)
  return getSnapshotsByType[type](uri)
  .then(saveSnapshotsInBatch)
}

const fromUri = changedEntityUri => {
  return getEntityByUri({ uri: changedEntityUri })
  .then(fromDoc)
}

export default { fromDoc, fromUri }

const multiWorkRefresh = relationProperty => async uri => {
  const uris = await urisByClaim(relationProperty, uri)
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

  work: uri => {
    return getEntityByUri({ uri })
    .then(work => {
      return getWorkAuthorsAndSeries(work)
      .then(([ authors, series ]) => {
        return Promise.all([
          getWorkSnapshot(uri, work, authors, series),
          getEditionsSnapshots(uri, [ work ], authors, series),
        ])
        .then(_.flatten)
      })
    })
  },

  human: multiWorkRefresh('wdt:P50'),
  serie: multiWorkRefresh('wdt:P179'),
}

const refreshTypes = Object.keys(getSnapshotsByType)

const getWorkSnapshot = (uri, work, authors, series) => {
  assert_.string(uri)
  assert_.object(work)
  assert_.array(authors)
  assert_.array(series)
  return buildSnapshot.work(work, authors, series)
}

const getEditionsSnapshots = async (uri, works, authors, series) => {
  assert_.string(uri)
  assert_.array(works)
  assert_.array(authors)
  assert_.array(series)

  return urisByClaim('wdt:P629', uri)
  .then(uris => getEntitiesByUris({ uris }))
  .then(res => Object.values(res.entities))
  .then(mappedArrayPromise(edition => getEditionSnapshot([ edition, works, authors, series ])))
}

const getEditionSnapshot = ([ edition, works, authors, series ]) => {
  assert_.object(edition)
  assert_.array(works)
  assert_.array(authors)
  assert_.array(series)
  // Expects a formatted edition
  assert_.string(edition.uri)
  return buildSnapshot.edition(edition, works, authors, series)
}
