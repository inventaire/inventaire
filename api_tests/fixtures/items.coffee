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
  createItem: (userPromise, itemData = {})->
    { entity } = itemData
    entityUriPromise = if entity then Promise.resolve(entity) else editionUriPromise

    entityUriPromise
    .then (entityUri)->
      body = _.extend {}, itemData, { entity: entityUri }
      customAuthReq userPromise, 'post', '/api/items', body

  createRandomizedItem: (userPromise, itemData = {})->
    { entity, listing, transaction } = itemData
    itemData.listing or= _.sample(listings)
    itemData.transaction or= _.sample(transactions)
    itemData.details = randomString 10
    itemData.notes = randomString 10
    return API.createItem userPromise, itemData
