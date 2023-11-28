import { difference, map, uniq } from 'lodash-es'
import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import { warn } from '#lib/utils/logs'

export default entities => {
  const { works, editions } = splitEntities(entities)
  const worksUris = map(works, 'uri')
  const data = { editionsWorksUris: [], editionWorkMap: {} }
  let { editionsWorksUris, editionWorkMap } = editions.reduce(aggregateEditionsWorksUris, data)
  // Do no refetch works already fetched
  editionsWorksUris = uniq(difference(editionsWorksUris, worksUris))
  return getEntitiesByUris({ uris: editionsWorksUris })
  .then(({ entities }) => entities)
  .then(editionsWorksEntities => {
    return {
      works: works.concat(Object.values(editionsWorksEntities)),
      editionWorkMap,
    }
  })
}

const splitEntities = entities => {
  return Object.values(entities)
  .reduce(splitWorksAndEditions, { works: [], editions: [] })
}

const splitWorksAndEditions = (results, entity) => {
  const { type } = entity
  if (type === 'work') results.works.push(entity)
  else if (type === 'edition') results.editions.push(entity)
  else warn(entity, 'invalid item entity type')
  return results
}

const aggregateEditionsWorksUris = (data, edition) => {
  const worksUris = edition.claims['wdt:P629']
  if (worksUris != null) {
    data.editionWorkMap[edition.uri] = worksUris
    data.editionsWorksUris.push(...worksUris)
  } else {
    warn(edition, 'edition without work')
  }
  return data
}
