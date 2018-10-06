CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ getUser, getUserB, authReq } = __.require 'apiTests', 'utils/utils'
{ createItem } = require './items'

module.exports =
  createTransaction: ->
    Promise.all [
      getUser()
      getUserB()
      createItem getUserB(), { listing: 'public', transaction: 'giving' }
    ]
    .spread (userA, userB, userBItem)->
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
