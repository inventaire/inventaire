import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { assert_ } from '#lib/utils/assert_types'
import { aggregateClaims } from './helpers.js'

const getRelativeEntities = relationProperty => async entity => {
  const uris = entity.claims[relationProperty]
  if (uris == null || uris.length === 0) return []
  return getEntitiesByUris({ uris })
  .then(res => Object.values(res.entities))
}

const getEditionWorks = getRelativeEntities('wdt:P629')
const getWorkAuthors = getRelativeEntities('wdt:P50')
const getWorkSeries = getRelativeEntities('wdt:P179')

export const getWorkAuthorsAndSeries = work => {
  return Promise.all([
    getWorkAuthors(work),
    getWorkSeries(work),
  ])
}

export const getEditionGraphFromEdition = edition => {
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
  'wdt:P179': aggregateClaims(works, 'wdt:P179'),
})

export const getEditionGraphEntities = uri => {
  return getEntityByUri({ uri })
  .then(getEditionGraphFromEdition)
}

export const getWorkGraphFromWork = (lang, work) => {
  return getWorkAuthorsAndSeries(work)
  .then(([ authors, series ]) => [ lang, work, authors, series ])
}
