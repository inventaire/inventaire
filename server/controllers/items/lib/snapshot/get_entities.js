import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { assert_ } from '#lib/utils/assert_types'
import { aggregateClaims } from './helpers.js'

const getRelativeEntities = relationProperty => async entity => {
  const uris = entity.claims[relationProperty]
  if (uris == null || uris.length === 0) return []
  const res = await getEntitiesByUris({ uris })
  return Object.values(res.entities)
}

const getEditionWorks = getRelativeEntities('wdt:P629')
const getWorkAuthors = getRelativeEntities('wdt:P50')
const getWorkSeries = getRelativeEntities('wdt:P179')

export async function getWorkAuthorsAndSeries (work) {
  return Promise.all([
    getWorkAuthors(work),
    getWorkSeries(work),
  ])
}

export async function getEditionGraphFromEdition (edition) {
  const works = await getEditionWorks(edition)
  assert_.array(works)
  const [ authors, series ] = await getWorksAuthorsAndSeries(works)
  // Tailor output to be spreaded on buildSnapshot.edition
  return [ edition, works, authors, series ]
}

function getWorksAuthorsAndSeries (works) {
  const mergedWorks = { claims: mergeWorksClaims(works) }
  return getWorkAuthorsAndSeries(mergedWorks)
}

// Aggregating edition's potentially multiple works claims to fit
// dependent functions' needs
function mergeWorksClaims (works) {
  return {
    'wdt:P50': aggregateClaims(works, 'wdt:P50'),
    'wdt:P179': aggregateClaims(works, 'wdt:P179'),
  }
}

export async function getEditionGraphEntities (uri) {
  const edition = await getEntityByUri({ uri })
  return getEditionGraphFromEdition(edition)
}

export async function getWorkGraphFromWork (lang, work) {
  const [ authors, series ] = await getWorkAuthorsAndSeries(work)
  return [ lang, work, authors, series ]
}
