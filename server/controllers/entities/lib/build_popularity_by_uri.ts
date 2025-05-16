import { map, property, sum, uniq } from 'lodash-es'
import { getAuthorWorks } from '#controllers/entities/lib/get_author_works'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getEntitiesPopularities } from '#controllers/entities/lib/popularity'
import { getReverseClaims } from '#controllers/entities/lib/reverse_claims'
import { getItemsByEntity } from '#controllers/items/lib/items'
import { isWdEntityUri } from '#lib/boolean_validations'
import { info, logError } from '#lib/utils/logs'
import type { EntityUri } from '#types/entity'
import { getSerieParts } from './get_serie_parts.js'

export async function buildPopularityByUri (uri: EntityUri) {
  let entity
  try {
    entity = await getEntityByUri({ uri, dry: true })
  } catch (err) {
    logError(err, `buildPopularityByUri could not get ${uri}`)
    // Known case: invalid uri (ex: isbn:9788380983435)
    // Rather return 0 than throwing an exception to prevent the job queue to retry
    // TODO: identify why invalid uris reach this point
    return 0
  }
  // Case where the entity wasn't available in cache
  if (entity == null) return 0

  const { type } = entity
  if (type == null) return 0

  const getter = popularityGettersByType[type]
  if (getter == null) return 0

  info(`building popularity: ${type} ${uri}`)
  const score = await getter(uri)
  return addBonusPoints(uri, score)
}

async function getItemsCount (uri) {
  const items = await getItemsByEntity(uri)
  const owners = map(items, 'owner')
  // Count the owners so that no more than one item per user is counted
  return uniq(owners).length
}

// Limit request to local entities as Wikidata editions entities are currently ignored
// see https://git.inventaire.io/inventaire/issues/182
const getEditionsScores = property => uri => {
  return getReverseClaims({ property, value: uri, dry: true })
  .then(editonsUris => {
    const editonsCount = editonsUris.length
    return Promise.all(editonsUris.map(getItemsCount))
    .then(editionsItemsCounts => sum(editionsItemsCounts) + editonsCount)
  })
}

const getWorkEditionsScores = getEditionsScores('wdt:P629')
const getPublisherScore = getEditionsScores('wdt:P123')

function getPartsScores (uri) {
  return getSerieParts({ uri, dry: true })
  .then(res => {
    const partsUris = res.parts.map(getUri)
    return getEntitiesPopularityTotal(partsUris)
  })
}

function getAuthorWorksScores (uri) {
  return getAuthorWorks({ uri, dry: true })
  .then(res => {
    const worksUris = res.works.map(getUri)
    const seriesCount = res.series.length
    const articlesCount = res.articles.length
    return getEntitiesPopularityTotal(worksUris)
    .then(worksScore => worksScore + seriesCount + articlesCount)
  })
}

const getUri = property('uri')

function getEntitiesPopularityTotal (uris) {
  return getEntitiesPopularities({ uris, refresh: true })
  .then(Object.values)
  // Total = sum of all popularities + number of subentities
  .then(results => sum(results) + results.length)
}

async function getSimpleEntityScore (uri) {
  const entity = await getEntityByUri({ uri })
  const claimCount = Object.values(entity.claims).flat().length
  const sitelinksCount = 'sitelinks' in entity ? Object.keys(entity.sitelinks).length : 0
  return claimCount + sitelinksCount * 2
}

const popularityGettersByType = {
  edition: getItemsCount,
  work: getWorkEditionsScores,
  serie: getPartsScores,
  human: getAuthorWorksScores,
  publisher: getPublisherScore,
  genre: getSimpleEntityScore,
  movement: getSimpleEntityScore,
  collection: getSimpleEntityScore,
  language: getSimpleEntityScore,
}

// Wikidata entities get a bonus as being on Wikidata is already kind of a proof of a certain
// level of popularity
function addBonusPoints (uri, score) {
  if (isWdEntityUri(uri)) return score + 2
  else return score
}
