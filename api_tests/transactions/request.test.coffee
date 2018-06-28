CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ getUser, getUserB, authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createTransaction } = require '../fixtures/transactions'
{ createItem } = require '../fixtures/items'

describe 'transactions:request', ->
  it 'should create a transaction', (done)->
    createTransaction()
    .then (res)->
      { transaction, userA, userB, userBItem } = res
      transaction.should.be.an.Object()
      transaction.item.should.equal userBItem._id
      transaction.requester.should.equal userA._id
      transaction.owner.should.equal userB._id
      done()
    .catch undesiredErr(done)

    return
