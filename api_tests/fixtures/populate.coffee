CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ createUser } = require './users'
{ createRandomizedItem } = require './items'

module.exports = ->
  Promise.all [
    createUserWithItems()
    createUserWithItems()
    createUserWithItems()
    createUserWithItems()
    createUserWithItems()
    createUserWithItems()
  ]

createUserWithItems = ->
  userPromise = createUser()
  Promise.all [
    createRandomizedItem userPromise, { listing: 'public'}
    createRandomizedItem userPromise, { listing: 'public'}
    createRandomizedItem userPromise, { listing: 'public'}
    createRandomizedItem userPromise, { listing: 'public'}
    createRandomizedItem userPromise
    createRandomizedItem userPromise
  ]
  .then (items)->
    userPromise
    .then (user)-> { user, items }
