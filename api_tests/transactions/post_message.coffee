CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createTransaction, addMessage } = require '../fixtures/transactions'

describe 'transactions:post:message', ->
  it 'should create a transaction', (done)->
    createTransaction()
    .then (res1)->
      { transaction, userA, userB, userBItem } = res1
      addMessage transaction
      .then (res2)->
        res2.ok.should.be.true()
        done()
    .catch undesiredErr(done)

    return
