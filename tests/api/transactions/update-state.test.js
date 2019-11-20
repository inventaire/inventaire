
const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { undesiredErr } = __.require('apiTests', 'utils/utils')
const { createTransaction } = require('../fixtures/transactions')
const { authReqB } = __.require('apiTests', 'utils/utils')

describe('transactions:update-state', () => it('should update state and apply side effects', done => {
  createTransaction()
  .then(transactionRes => {
    const { transaction } = transactionRes
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
