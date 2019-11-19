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
const { createTransaction, addMessage } = require('../fixtures/transactions')

describe('transactions:post:message', () => it('should create a transaction', done => {
  createTransaction()
  .then(res1 => {
    const { transaction } = res1
    return addMessage(transaction)
    .then(res2 => {
      res2.ok.should.be.true()
      done()
    })
  })
  .catch(undesiredErr(done))
}))
