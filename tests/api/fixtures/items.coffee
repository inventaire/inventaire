CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ customAuthReq } = require '../utils/request'
{ getUser } = require '../utils/utils'
{ createEdition } = require './entities'
faker = require 'faker'

urisPromises = {}
getEditionUriPromise = (lang)->
  urisPromises[lang] or= createEdition({ lang }).get 'uri'
  return urisPromises[lang]

count = 0
getEditionUri = ->
  # Get 4/5 'en' editions, 1/5 'de' editions
  lang = if count % 4 is 0 then 'de' else 'en'
  count += 1
  return getEditionUriPromise lang

listings = [ 'private', 'network', 'public' ]
transactions = [ 'giving', 'lending', 'selling', 'inventorying' ]

module.exports = API =
  createItems: (userPromise, itemsData = [])->
    userPromise or= getUser()
    entity = if itemsData[0]? then itemsData[0].entity
    entityUriPromise = if entity then Promise.resolve(entity) else getEditionUri()

    entityUriPromise
    .then (entityUri)->
      items = itemsData.map addDefaultEntity(entityUri)
      customAuthReq userPromise, 'post', '/api/items', items

  createItem: (userPromise, itemData = {})->
    itemData.listing or= 'public'
    API.createItems userPromise, [ itemData ]
    .get '0'

  createEditionAndItem: (userPromise, itemData = {})->
    createEdition()
    .then (edition)-> API.createItem userPromise, { entity: "inv:#{edition._id}" }

  createRandomizedItems: (userPromise, itemsData)->
    return API.createItems userPromise, itemsData.map(randomizedItem)

randomizedItem = (itemData)->
  { entity, listing, transaction } = itemData
  itemData.listing or= _.sample(listings)
  itemData.transaction or= _.sample(transactions)
  itemData.details = faker.hacker.phrase()
  itemData.notes = faker.lorem.paragraph()
  return itemData

addDefaultEntity = (entityUri)-> (item)->
  item.entity or= entityUri
  return item
