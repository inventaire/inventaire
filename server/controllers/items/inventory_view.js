const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const items_ = require('./lib/items')
const user_ = __.require('controllers', 'user/lib/user')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')
const getByAccessLevel = require('./lib/get_by_access_level')

module.exports = (req, res) => {
  const { _id: reqUserId } = req.user

  // get all network items
  return user_.getNetworkIds(reqUserId)
  .then(ids => promises_.all([
    items_.byOwner(reqUserId),
    getByAccessLevel.network(ids, reqUserId)
  ]))
  .then(_.flatten)
  .then(items => {
    const uris = _.uniq(items.map(_.property('entity')))
    return getEntitiesByUris({ uris })
    .get('entities')
    .then(replaceEditionsByTheirWork)
    .then(data => {
      const { works, editionWorkMap } = data
      const worksTree = buildInvertedClaimTree(works)
      const workUriItemsMap = items.reduce(buildWorkUriItemsMap(editionWorkMap), {})
      const itemsByDate = getItemsByDate(items)
      const worksByOwner = items.reduce(aggregateOwnersWorks(editionWorkMap), {})
      worksTree.owner = worksByOwner
      return { worksTree, workUriItemsMap, itemsByDate }
    })
  })

  // get associated entities
  // sort items by entities properties
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

// Maybe we need a system of per-user inventory view
// than can be aggregated per-visibility

const replaceEditionsByTheirWork = entities => {
  let { works, editions } = splitEntities(entities)
  const worksUris = works.map(_.property('uri'))
  const data = { editionsWorksUris: [], editionWorkMap: {} }
  let { editionsWorksUris, editionWorkMap } = editions.reduce(aggregateEditionsWorksUris, data)
  // Do no refetch works already fetched
  editionsWorksUris = _.uniq(_.difference(editionsWorksUris, worksUris))
  return getEntitiesByUris({ uris: editionsWorksUris })
  .get('entities')
  .then(editionsWorksEntities => {
    works = works.concat(_.values(editionsWorksEntities))
    return { works, editionWorkMap }
  })
}

const splitEntities = entities => _.values(entities).reduce(splitWorksAndEditions, { works: [], editions: [] })

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

const buildInvertedClaimTree = entities => entities.reduce(addToTree, {})

const viewProperties = [ 'wdt:P50', 'wdt:P136', 'wdt:P921' ]

const addToTree = (tree, entity) => {
  const { uri } = entity
  for (const property of viewProperties) {
    if (!tree[property]) { tree[property] = { unknown: [] } }
    const values = entity.claims[property]
    if (values != null) {
      for (const value of values) {
        if (!tree[property][value]) { tree[property][value] = [] }
        tree[property][value].push(uri)
      }
    } else {
      tree[property].unknown.push(uri)
    }
  }

  return tree
}

const buildWorkUriItemsMap = editionWorkMap => (workUriItemsMap, item) => {
  const { _id: itemId, entity: itemEntityUri } = item
  const itemWorksUris = editionWorkMap[itemEntityUri] || [ itemEntityUri ]
  for (const workUri of itemWorksUris) {
    if (!workUriItemsMap[workUri]) { workUriItemsMap[workUri] = [] }
    workUriItemsMap[workUri].push(itemId)
  }
  return workUriItemsMap
}

const getItemsByDate = items => {
  return items
  .sort(sortByCreationDate)
  .map(getId)
}

const getId = _.property('_id')
const sortByCreationDate = (a, b) => b.created - a.created

const aggregateOwnersWorks = editionWorkMap => (index, item) => {
  const { _id: itemId, owner: ownerId, entity: entityUri } = item
  const workUri = editionWorkMap[entityUri] || entityUri
  if (!index[ownerId]) { index[ownerId] = {} }
  if (!index[ownerId][workUri]) { index[ownerId][workUri] = [] }
  index[ownerId][workUri].push(itemId)
  return index
}
