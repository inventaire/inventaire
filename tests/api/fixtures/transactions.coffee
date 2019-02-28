CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ getUser, getUserB, authReq } = __.require 'apiTests', 'utils/utils'
{ createItem } = require './items'
{ addAuthor } = require './entities'
{ getByUri: getEntityByUri } = require '../utils/entities'
{ getById: getRefreshedItem } = require '../utils/items'

module.exports =
  createTransaction: ->
    createItem getUserB(), { listing: 'public', transaction: 'giving' }
    .tap addAuthorToItemEditionWork
    .then getRefreshedItem
    .then (userBItem)->
      Promise.all [
        getUser()
        getUserB()
      ]
      .spread (userA, userB)->
        authReq 'post', '/api/transactions?action=request',
          item: userBItem._id
          message: 'yo'
        .then (res)->
          _.extend res, { userA, userB, userBItem }
          return res

  addMessage: (transaction)->
    authReq 'post', '/api/transactions?action=message',
      action: 'message'
      transaction: transaction._id
      message: 'yo'

addAuthorToItemEditionWork = (item)->
  getEntityByUri item.entity
  .then (edition)->
    workUri = edition.claims['wdt:P629'][0]
    return addAuthor workUri
