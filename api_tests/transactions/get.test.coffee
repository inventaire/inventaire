CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createTransaction } = require '../fixtures/transactions'

describe 'transactions:get', ->
  it 'should get user transactions', (done)->
    createTransaction()
    .then (res1)->
      { transaction, userA, userB, userBItem } = res1
      authReq 'get', '/api/transactions'
      .then (res2)->
        res2.transactions.should.be.an.Array()
        transactionsIds = _.pluck res2.transactions, '_id'
        transactionsIds.should.containEql transaction._id
        done()
    .catch undesiredErr(done)

    return
