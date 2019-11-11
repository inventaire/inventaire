// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const should = require('should')
const { authReq, authReqB, undesiredErr } = require('../utils/utils')
const { newItemBase } = require('./helpers')

describe('items:bulk-update', () => {
  it('should update an item details', (done) => {
    authReq('post', '/api/items', newItemBase())
    .then((item) => {
      const newTransaction = 'lending'
      item.transaction.should.not.equal(newTransaction)
      const ids = [ item._id ]
      return authReq('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'transaction',
        value: newTransaction
      }).then((res) => {
        res.ok.should.be.true()
        return authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
        .get('items')
        .then((updatedItems) => {
          updatedItems[0].transaction.should.equal(newTransaction)
          done()
        })
      })}).catch(undesiredErr(done))

  })

  it('should not update an item from another owner', (done) => {
    authReq('post', '/api/items', newItemBase())
    .then((item) => {
      const ids = [ item._id ]
      return authReqB('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'transaction',
        value: 'lending'
      }).catch((err) => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('user isnt item.owner')
        done()
      })}).catch(undesiredErr(done))

  })
})
