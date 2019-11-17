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
const { authReq, authReqB } = __.require('apiTests', 'utils/utils')

describe('transactions:update-state', () => it('should update state and apply side effects', done => {
  createTransaction()
  .then(transactionRes => {
    const { transaction, userA, userB, userBItem } = transactionRes
    return authReqB('put', '/api/transactions?action=update-state', {
      transaction: transaction._id,
      state: 'accepted'
    })
    .then(updateRes => {
      updateRes.ok.should.be.true()
      done()
    })
  })
  .catch(undesiredErr(done))
}))
