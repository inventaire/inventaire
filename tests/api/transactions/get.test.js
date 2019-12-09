const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqC, undesiredErr } = __.require('apiTests', 'utils/utils')
const { createTransaction } = require('../fixtures/transactions')
const transactionPromise = createTransaction()

describe('transactions:get', () => {
  it('should get user transactions', done => {
    transactionPromise
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
  })

  it('should not get other users transactions', done => {
    transactionPromise
    .then(res1 => {
      const { transaction } = res1
      return authReqC('get', '/api/transactions')
      .then(res2 => {
        const transactionsIds = _.map(res2.transactions, '_id')
        transactionsIds.should.not.containEql(transaction._id)
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})
