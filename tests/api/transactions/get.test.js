
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, undesiredErr } = __.require('apiTests', 'utils/utils')
const { createTransaction } = require('../fixtures/transactions')

describe('transactions:get', () => it('should get user transactions', done => {
  createTransaction()
  .then(res1 => {
    const { transaction } = res1
    return authReq('get', '/api/transactions')
    .then(res2 => {
      res2.transactions.should.be.an.Array()
      const transactionsIds = _.map(res2.transactions, '_id')
      transactionsIds.should.containEql(transaction._id)
      done()
    })
  })
  .catch(undesiredErr(done))
}))
