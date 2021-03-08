const __ = require('config').universalPath
const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const getEntitiesByUris = require('controllers/entities/lib/get_entities_by_uris')
const { aggregateClaims } = require('./helpers')

const getRelativeEntities = relationProperty => async entity => {
  const uris = entity.claims[relationProperty]
  if (uris == null || uris.length === 0) return []
  return getEntitiesByUris({ uris })
  .then(res => _.values(res.entities))
}

const getEditionWorks = getRelativeEntities('wdt:P629')
const getWorkAuthors = getRelativeEntities('wdt:P50')
const getWorkSeries = getRelativeEntities('wdt:P179')

const getWorkAuthorsAndSeries = work => {
  return Promise.all([
    getWorkAuthors(work),
    getWorkSeries(work)
  ])
}

const getEditionGraphFromEdition = edition => {
  return getEditionWorks(edition)
  .then(works => {
    assert_.array(works)
    return getWorksAuthorsAndSeries(works)
    // Tailor output to be spreaded on buildSnapshot.edition
    .then(([ authors, series ]) => [ edition, works, authors, series ])
  })
}

const getWorksAuthorsAndSeries = works => {
  const mergedWorks = { claims: mergeWorksClaims(works) }
  return getWorkAuthorsAndSeries(mergedWorks)
}

// Aggregating edition's potentially multiple works claims to fit
// dependent functions' needs
const mergeWorksClaims = works => ({
  'wdt:P50': aggregateClaims(works, 'wdt:P50'),
  'wdt:P179': aggregateClaims(works, 'wdt:P179')
})

const getEditionGraphEntities = uri => {
  return getEntityByUri({ uri })
  .then(getEditionGraphFromEdition)
}

const getWorkGraphFromWork = (lang, work) => {
  return getWorkAuthorsAndSeries(work)
  .then(([ authors, series ]) => [ lang, work, authors, series ])
}

module.exports = {
  getWorkAuthorsAndSeries,
  getEditionGraphFromEdition,
  getEditionGraphEntities,
  getWorkGraphFromWork
}
