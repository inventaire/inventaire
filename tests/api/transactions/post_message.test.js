const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, authReqC, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { createTransaction, addMessage } = require('../fixtures/transactions')

const endpoint = '/api/transactions?action=message'
const transactionPromise = createTransaction()

describe('transactions:post:message', () => {
  it('should create a transaction', async () => {
    const res = await transactionPromise
    const res2 = await addMessage(res.transaction)
    res2.ok.should.be.true()
  })

  it('should reject without transaction', async () => {
    try {
      await authReq('post', endpoint, { action: 'message' })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: transaction')
    }
  })

  it('should reject without message', async () => {
    try {
      const res1 = await transactionPromise
      const { transaction } = res1
      await authReq('post', endpoint, {
        action: 'message',
        transaction: transaction._id
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: message')
    }
  })

  it('should reject an message empty message', async () => {
    try {
      const res1 = await transactionPromise
      const { transaction } = res1
      const res2 = await authReq('post', endpoint, {
        action: 'message',
        transaction: transaction._id,
        message: ''
      })
      shouldNotBeCalled(res2)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid message')
    }
  })

  it('should reject non-string messages', async () => {
    try {
      const res1 = await transactionPromise
      const { transaction } = res1
      const res2 = await authReq('post', endpoint, {
        action: 'message',
        transaction: transaction._id,
        message: 1
      })
      shouldNotBeCalled(res2)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid message')
    }
  })

  it('should reject when requested by a user not involved in transaction', async () => {
    try {
      const res1 = await transactionPromise
      const { transaction } = res1
      const res2 = await authReqC('post', endpoint, {
        action: 'message',
        transaction: transaction._id,
        message: 'yo'
      })
      shouldNotBeCalled(res2)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('wrong user')
    }
  })
})
