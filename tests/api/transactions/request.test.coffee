CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createTransaction } = require '../fixtures/transactions'

describe 'transactions:request', ->
  it 'should create a transaction', (done)->
    createTransaction()
    .then (res)->
      { transaction, userA, userB, userBItem } = res
      transaction.should.be.an.Object()
      transaction.item.should.equal userBItem._id
      transaction.requester.should.equal userA._id
      transaction.owner.should.equal userB._id
      { snapshot } = transaction
      snapshot.item.entity.should.equal userBItem.entity
      snapshot.owner.username.should.equal userB.username
      snapshot.owner.picture.should.equal userB.picture
      snapshot.requester.username.should.equal userA.username
      snapshot.requester.picture.should.equal userA.picture
      snapshot.entity.image.should.equal userBItem.snapshot['entity:image']
      snapshot.entity.authors.should.equal userBItem.snapshot['entity:authors']
      done()
    .catch undesiredErr(done)

    return
