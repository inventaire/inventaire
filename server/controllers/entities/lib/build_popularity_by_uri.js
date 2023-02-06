import _ from '#builders/utils'
import getSerieParts from './get_serie_parts.js'

let getItemsByEntity, getEntityByUri, reverseClaims, getEntitiesPopularities, getAuthorWorks
const importCircularDependencies = async () => {
  ;({ getItemsByEntity } = await import('#controllers/items/lib/items'))
  ;({ getEntityByUri } = await import('./get_entity_by_uri.js'))
  ;({ reverseClaims } = await import('./reverse_claims.js'))
  ;({ getEntitiesPopularities } = await import('./popularity.js'))
  ;({ getAuthorWorks } = await import('./get_author_works.js'))
}
setImmediate(importCircularDependencies)

export async function buildPopularityByUri (uri) {
  const entity = await getEntityByUri({ uri, dry: true })
  // Case where the entity wasn't available in cache
  if (entity == null) return 0

  const { type } = entity
  if (type == null) return 0

  const getter = popularityGettersByType[type]
  if (getter == null) return 0

  const score = await getter(uri)
  return addBonusPoints(uri, score)
}

const getItemsCount = async uri => {
  const items = await getItemsByEntity(uri)
  const owners = _.map(items, 'owner')
  // Count the owners so that no more than one item per user is counted
  return _.uniq(owners).length
}

// Limit request to local entities as Wikidata editions entities are currently ignored
// see https://github.com/inventaire/inventaire/issues/182
const getEditionsScores = property => uri => {
  return reverseClaims({ property, value: uri, dry: true })
  .then(editonsUris => {
    const editonsCount = editonsUris.length
    return Promise.all(editonsUris.map(getItemsCount))
    .then(editionsItemsCounts => _.sum(editionsItemsCounts) + editonsCount)
  })
}

const getWorkEditionsScores = getEditionsScores('wdt:P629')
const getPublisherScore = getEditionsScores('wdt:P123')

const getPartsScores = uri => {
  return getSerieParts({ uri, dry: true })
  .then(res => {
    const partsUris = res.parts.map(getUri)
    return getEntitiesPopularityTotal(partsUris)
  })
}

const getAuthorWorksScores = uri => {
  return getAuthorWorks({ uri, dry: true })
  .then(res => {
    const worksUris = res.works.map(getUri)
    const seriesCount = res.series.length
    const articlesCount = res.articles.length
    return getEntitiesPopularityTotal(worksUris)
    .then(worksScore => worksScore + seriesCount + articlesCount)
  })
}

const getUri = _.property('uri')

const getEntitiesPopularityTotal = uris => {
  return getEntitiesPopularities({ uris, refresh: true })
  .then(Object.values)
  // Total = sum of all popularities + number of subentities
  .then(results => _.sum(results) + results.length)
}

const popularityGettersByType = {
  edition: getItemsCount,
  work: getWorkEditionsScores,
  serie: getPartsScores,
  human: getAuthorWorksScores,
  publisher: getPublisherScore,
}

// Wikidata entities get a bonus as being on Wikidata is already kind of a proof of a certain
// level of popularity
const addBonusPoints = (uri, score) => {
  if (_.isWdEntityUri(uri)) return score + 2
  else return score
}
