CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createTransaction } = require '../fixtures/transactions'
{ authReq, authReqB } = __.require 'apiTests', 'utils/utils'


describe 'transactions:update-state', ->
  it 'should update state and apply side effects', (done)->
    createTransaction()
    .then (transactionRes)->
      { transaction, userA, userB, userBItem } = transactionRes
      authReqB 'put', '/api/transactions?action=update-state', {
        transaction: transaction._id
        state: 'accepted'
      }
      .then (updateRes)->
        updateRes.ok.should.be.true()
        done()
    .catch undesiredErr(done)

    return
