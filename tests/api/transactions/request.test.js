// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { undesiredErr } = __.require('apiTests', 'utils/utils')
const { createTransaction } = require('../fixtures/transactions')

describe('transactions:request', () => it('should create a transaction', done => {
  createTransaction()
  .then(res => {
    const { transaction, userA, userB, userBItem } = res
    transaction.should.be.an.Object()
    transaction.item.should.equal(userBItem._id)
    transaction.requester.should.equal(userA._id)
    transaction.owner.should.equal(userB._id)
    const { snapshot } = transaction
    snapshot.item.entity.should.equal(userBItem.entity)
    snapshot.owner.username.should.equal(userB.username)
    snapshot.owner.picture.should.equal(userB.picture)
    snapshot.requester.username.should.equal(userA.username)
    snapshot.requester.picture.should.equal(userA.picture)
    snapshot.entity.image.should.equal(userBItem.snapshot['entity:image'])
    snapshot.entity.authors.should.equal(userBItem.snapshot['entity:authors'])
    done()
  })
  .catch(undesiredErr(done))
}))
