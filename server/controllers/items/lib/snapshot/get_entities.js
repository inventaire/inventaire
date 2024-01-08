import { getAggregatedPropertiesValues } from '#controllers/entities/lib/entities'
import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import { assert_ } from '#lib/utils/assert_types'
import { aggregateClaims } from './helpers.js'

const getRelativeEntities = relationProperties => async entity => {
  const uris = getAggregatedPropertiesValues(entity.claims, relationProperties)
  if (uris == null || uris.length === 0) return []
  const { entities } = await getEntitiesByUris({ uris })
  return Object.values(entities)
}

const getEditionWorks = getRelativeEntities([ 'wdt:P629' ])
const getWorkAuthors = getRelativeEntities(authorRelationsProperties)
const getWorkSeries = getRelativeEntities([ 'wdt:P179' ])

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

const workRelationsProperties = authorRelationsProperties.concat([ 'wdt:P179' ])
// Aggregating edition's potentially multiple works claims to fit
// dependent functions' needs
function mergeWorksClaims (works) {
  return Object.fromEntries(workRelationsProperties.map(property => {
    return [ property, aggregateClaims(works, property) ]
  }))
}

export async function getEditionGraphEntities (uri) {
  const edition = await getEntityByUri({ uri })
  return getEditionGraphFromEdition(edition)
}

export async function getWorkGraphFromWork (lang, work) {
  const [ authors, series ] = await getWorkAuthorsAndSeries(work)
  return [ lang, work, authors, series ]
}
