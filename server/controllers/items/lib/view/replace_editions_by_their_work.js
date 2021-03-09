const _ = require('builders/utils')
const getEntitiesByUris = require('controllers/entities/lib/get_entities_by_uris')

module.exports = entities => {
  const { works, editions } = splitEntities(entities)
  const worksUris = _.map(works, 'uri')
  const data = { editionsWorksUris: [], editionWorkMap: {} }
  let { editionsWorksUris, editionWorkMap } = editions.reduce(aggregateEditionsWorksUris, data)
  // Do no refetch works already fetched
  editionsWorksUris = _.uniq(_.difference(editionsWorksUris, worksUris))
  return getEntitiesByUris({ uris: editionsWorksUris })
  .then(({ entities }) => entities)
  .then(editionsWorksEntities => {
    return {
      works: works.concat(_.values(editionsWorksEntities)),
      editionWorkMap
    }
  })
}

const splitEntities = entities => {
  return _.values(entities)
  .reduce(splitWorksAndEditions, { works: [], editions: [] })
}

const splitWorksAndEditions = (results, entity) => {
  const { type } = entity
  if (type === 'work') results.works.push(entity)
  else if (type === 'edition') results.editions.push(entity)
  else _.warn(entity, 'invalid item entity type')
  return results
}

const aggregateEditionsWorksUris = (data, edition) => {
  const worksUris = edition.claims['wdt:P629']
  if (worksUris != null) {
    data.editionWorkMap[edition.uri] = worksUris
    data.editionsWorksUris.push(...worksUris)
  } else {
    _.warn(edition, 'edition without work')
  }
  return data
}
