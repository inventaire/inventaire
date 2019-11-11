CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ createUser } = require './users'
{ createRandomizedItems } = require './items'

populatePromise = null
usersCount = 8
publicItemsPerUser = 10

module.exports = API =
  populate: ->
    if populatePromise? then return populatePromise
    populatePromise = Promise.all _.times(usersCount, API.createUserWithItems)
    return populatePromise

  createUserWithItems: ->
    userPromise = createUser()
    userPromise
    .then ->
      itemsData = _.times publicItemsPerUser, -> { listing: 'public' }
      return createRandomizedItems userPromise, itemsData
    .then -> userPromise
