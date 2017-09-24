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
    .then buildInvertedClaimTree

  # get associated entities
  # sort items by entities properties
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

# Maybe we need a system of per-user inventory view
# than can be aggregated per-visibility

replaceEditionsByTheirWork = (entities)->
  { works, editions } = splitEntities entities
  worksUris = works.map _.property('uri')
  _.log worksUris, 'worksUris'
  editionsWorkUris = _.compact editions.map(getEditionWorkUri)
  # Do no refetch works already fetched
  editionsWorkUris = _.uniq _.difference(editionsWorkUris, worksUris)
  _.log editionsWorkUris, 'editionsWorkUris'
  getEntitiesByUris editionsWorkUris
  .get 'entities'
  .then (editionsWorkEntities)-> works.concat _.values(editionsWorkEntities)

splitEntities = (entities)->
  _.values(entities).reduce splitWorksAndEditions, { works: [], editions: [] }

splitWorksAndEditions = (results, entity)->
  if entity.type is 'work' then results.works.push entity
  else results.editions.push entity
  return results

getEditionWorkUri = (edition)->
  workUris = edition.claims['wdt:P629']
  unless workUris? then return _.warn edition, 'edition without work'
  return workUris[0]

buildInvertedClaimTree = (entities)-> entities.reduce addToTree, {}

viewProperties = [ 'wdt:P31', 'wdt:P50', 'wdt:P136' ]

addToTree = (tree, entity)->
  { uri, claims } = entity
  for property in viewProperties
    values = entity.claims[property]
    if values?
      for value in values
        tree[property] or= {}
        tree[property][value] or= []
        tree[property][value].push uri

  return tree
