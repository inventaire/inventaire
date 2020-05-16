const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReqB, authReqC, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { createTransaction } = require('../fixtures/transactions')

const endpoint = '/api/transactions?action=update-state'

describe('transactions:update-state', () => {
  it('should update state and apply side effects', async () => {
    const transactionRes = await createTransaction()
    const { transaction } = transactionRes
    const updateRes = await authReqB('put', endpoint, {
      transaction: transaction._id,
      state: 'accepted'
    })
    updateRes.ok.should.be.true()
  })

  it('should not update unknown state', async () => {
    try {
      const transactionRes = await createTransaction()
      const { transaction } = transactionRes
      const updateRes = await authReqB('put', endpoint, {
        transaction: transaction._id,
        state: 'random state'
      })
      shouldNotBeCalled(updateRes)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid state')
    }
  })

  it('should not update when requested by a user not involved in transaction', async () => {
    try {
      const transactionRes = await createTransaction()
      const { transaction } = transactionRes
      const updateRes = await authReqC('put', endpoint, {
        transaction: transaction._id,
        state: 'accepted'
      })
      shouldNotBeCalled(updateRes)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('wrong user')
    }
  })
})
