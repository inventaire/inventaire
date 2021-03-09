require('should')
const { authReq, authReqC, shouldNotBeCalled } = require('apiTests/utils/utils')
const { getSomeTransaction, addMessage } = require('../fixtures/transactions')

const endpoint = '/api/transactions?action=message'

describe('transactions:post:message', () => {
  it('should create a transaction', async () => {
    const { transaction } = await getSomeTransaction()
    const res2 = await addMessage(transaction)
    res2.ok.should.be.true()
  })

  it('should reject without transaction', async () => {
    await authReq('post', endpoint, { action: 'message' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: transaction')
    })
  })

  it('should reject without message', async () => {
    const { transaction } = await getSomeTransaction()
    await authReq('post', endpoint, {
      action: 'message',
      transaction: transaction._id
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: message')
    })
  })

  it('should reject an message empty message', async () => {
    const { transaction } = await getSomeTransaction()
    await authReq('post', endpoint, {
      action: 'message',
      transaction: transaction._id,
      message: ''
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid message')
    })
  })

  it('should reject non-string messages', async () => {
    const { transaction } = await getSomeTransaction()
    await authReq('post', endpoint, {
      action: 'message',
      transaction: transaction._id,
      message: 1
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid message')
    })
  })

  it('should reject when requested by a user not involved in transaction', async () => {
    const { transaction } = await getSomeTransaction()
    await authReqC('post', endpoint, {
      action: 'message',
      transaction: transaction._id,
      message: 'yo'
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('wrong user')
    })
  })
})
