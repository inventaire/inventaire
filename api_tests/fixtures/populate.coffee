CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ createUser } = require './users'
{ createRandomizedItem } = require './items'

module.exports = (params) ->
  { usersCount } = params
  promiseArray = [1..usersCount].map ->
    createUserWithItems(params)
  Promise.all promiseArray

createUserWithItems = (params) ->
  { itemsPerUser, publicItemsPerUser } = params
  userPromise = createUser()
  userPromise.then ->
    if itemsPerUser
      [1..itemsPerUser].forEach ->
        createRandomizedItem userPromise
    if publicItemsPerUser
      [1..publicItemsPerUser].forEach ->
        createRandomizedItem userPromise, { listing: 'public'}
