CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createTransaction, addMessage } = require '../fixtures/transactions'
{ authReq } = __.require 'apiTests', 'utils/utils'

describe 'transactions:get:messages', ->
  it 'should get a transaction messages', (done)->
    createTransaction()
    .then (res1)->
      { transaction, userA, userB, userBItem } = res1
      addMessage transaction
      .then (res2)->
        authReq 'get', '/api/transactions?action=get-messages', { transaction }
        .then (res3)->
          res3.messages.should.be.an.Array()
          should(res3.messages.length > 0).be.true()
          done()
    .catch undesiredErr(done)

    return
