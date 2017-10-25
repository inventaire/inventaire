__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
items_ = require './lib/items'
user_ = __.require 'controllers', 'user/lib/user'
getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'

module.exports = (req, res)->
  { _id:reqUserId } = req.user

  # get all network items
  user_.getNetworkIds reqUserId
  .then (ids)->
    promises_.all [
      items_.byOwner reqUserId
      items_.networkListings ids, reqUserId
    ]
  .then _.flatten
  .then (items)->
    uris = _.uniq items.map(_.property('entity'))
    getEntitiesByUris uris
    .get 'entities'
    .then replaceEditionsByTheirWork
    .then (data)->
      { works, editionWorkMap } = data
      worksTree = buildInvertedClaimTree works
      workUriItemsMap = items.reduce buildWorkUriItemsMap(editionWorkMap), {}
      itemsByDate = getItemsByDate items
      worksByOwner = items.reduce aggregateOwnersWorks(editionWorkMap), {}
      worksTree.owner = worksByOwner
      return { worksTree, workUriItemsMap, itemsByDate }

  # get associated entities
  # sort items by entities properties
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

# Maybe we need a system of per-user inventory view
# than can be aggregated per-visibility

replaceEditionsByTheirWork = (entities)->
  { works, editions } = splitEntities entities
  worksUris = works.map _.property('uri')
  data = { editionsWorksUris: [], editionWorkMap: {} }
  { editionsWorksUris, editionWorkMap } = editions.reduce aggregateEditionsWorksUris, data
  # Do no refetch works already fetched
  editionsWorksUris = _.uniq _.difference(editionsWorksUris, worksUris)
  getEntitiesByUris editionsWorksUris
  .get 'entities'
  .then (editionsWorksEntities)->
    works = works.concat _.values(editionsWorksEntities)
    return { works, editionWorkMap }

splitEntities = (entities)->
  _.values(entities).reduce splitWorksAndEditions, { works: [], editions: [] }

splitWorksAndEditions = (results, entity)->
  if entity.type is 'work' then results.works.push entity
  else results.editions.push entity
  return results

aggregateEditionsWorksUris = (data, edition)->
  worksUris = edition.claims['wdt:P629']
  if worksUris?
    data.editionWorkMap[edition.uri] = worksUris
    data.editionsWorksUris.push worksUris...
  else
    _.warn edition, 'edition without work'
  return data

buildInvertedClaimTree = (entities)-> entities.reduce addToTree, {}

viewProperties = [ 'wdt:P50', 'wdt:P136', 'wdt:P921' ]

addToTree = (tree, entity)->
  { uri, claims } = entity
  for property in viewProperties
    tree[property] or= { unknown: [] }
    values = entity.claims[property]
    if values?
      for value in values
        tree[property][value] or= []
        tree[property][value].push uri
    else
      tree[property].unknown.push uri

  return tree

buildWorkUriItemsMap = (editionWorkMap)-> (workUriItemsMap, item)->
  { _id:itemId, entity:itemEntityUri } = item
  itemWorksUris = editionWorkMap[itemEntityUri] or [ itemEntityUri ]
  for workUri in itemWorksUris
    workUriItemsMap[workUri] or= []
    workUriItemsMap[workUri].push itemId
  return workUriItemsMap

getItemsByDate = (items)->
  items
  .sort sortByCreationDate
  .map getId

getId = _.property '_id'
sortByCreationDate = (a, b)-> b.created - a.created

aggregateOwnersWorks = (editionWorkMap)-> (index, item)->
  { _id:itemId, owner:ownerId, entity:entityUri } = item
  workUri = editionWorkMap[entityUri] or entityUri
  index[ownerId] or= {}
  index[ownerId][workUri] or= []
  index[ownerId][workUri].push itemId
  return index
