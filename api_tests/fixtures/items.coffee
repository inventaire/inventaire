CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ customAuthReq } = require '../utils/request'
{ createEdition } = require './entities'
randomString = __.require 'lib', './utils/random_string'

editionUriPromise = createEdition().get 'uri'

listings = [ 'private', 'network', 'public' ]
transactions = [ 'giving', 'lending', 'selling', 'inventorying' ]

module.exports = API =
  createItems: (userPromise, itemsData = {})->
    { entity } = itemsData[0]
    entityUriPromise = if entity then Promise.resolve(entity) else editionUriPromise

    entityUriPromise
    .then (entityUri)->
      items = itemsData.map addDefaultEntity(entityUri)
      customAuthReq userPromise, 'post', '/api/items', items

  createRandomizedItems: (userPromise, itemsData)->
    return API.createItems userPromise, itemsData.map(randomizedItem)

randomizedItem = (itemData)->
  { entity, listing, transaction } = itemData
  itemData.listing or= _.sample(listings)
  itemData.transaction or= _.sample(transactions)
  itemData.details = randomString 10
  itemData.notes = randomString 10
  return itemData

addDefaultEntity = (entityUri)-> (item)->
  itemData.entity or= entityUri
  return itemData
