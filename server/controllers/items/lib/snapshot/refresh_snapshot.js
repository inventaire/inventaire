const _ = require('builders/utils')
const promises_ = require('lib/promises')
const assert_ = require('lib/utils/assert_types')
const entities_ = require('controllers/entities/lib/entities')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const getEntitiesByUris = require('controllers/entities/lib/get_entities_by_uris')
const buildSnapshot = require('./build_snapshot')
const { getWorkAuthorsAndSeries, getEditionGraphEntities } = require('./get_entities')
const { getDocData } = require('./helpers')

// Working around circular dependencies
let snapshot_
const lateRequire = () => { snapshot_ = require('./snapshot') }
setTimeout(lateRequire, 0)

const fromDoc = changedEntityDoc => {
  const [ uri, type ] = getDocData(changedEntityDoc)
  if (!refreshTypes.includes(type)) return

  const label = `${uri} items snapshot refresh`

  _.info(`${label}: starting`)
  return getSnapshotsByType[type](uri)
  .then(snapshot_.batch)
}

const fromUri = changedEntityUri => {
  return getEntityByUri({ uri: changedEntityUri })
  .then(fromDoc)
}

module.exports = { fromDoc, fromUri }

const multiWorkRefresh = relationProperty => async uri => {
  const uris = await entities_.urisByClaim(relationProperty, uri)
  const snapshots = await Promise.all(uris.map(getSnapshotsByType.work))
  return _.flatten(snapshots)
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
          getEditionsSnapshots(uri, [ work ], authors, series)
        ])
        .then(_.flatten)
      })
    })
  },

  human: multiWorkRefresh('wdt:P50'),
  serie: multiWorkRefresh('wdt:P179')
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

  return entities_.urisByClaim('wdt:P629', uri)
  .then(uris => getEntitiesByUris({ uris }))
  .then(res => _.values(res.entities))
  .then(promises_.map(edition => getEditionSnapshot([ edition, works, authors, series ])))
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
