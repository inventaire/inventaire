const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, authReqB, authReqC, shouldNotBeCalled } = __.require('apiTests', 'utils/utils')
const { createTransaction } = require('../fixtures/transactions')

const endpoint = '/api/transactions?action=mark-as-read'

describe('transactions:update-state', () => {
  it('should reject without id', async () => {
    await authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    })
  })

  it('should update transaction read state', async () => {
    const { transaction } = await createTransaction()
    transaction.read.should.deepEqual({ requester: true, owner: false })
    await authReqB('put', endpoint, { id: transaction._id })
    const { transactions } = await authReq('get', '/api/transactions')
    const updatedTransation = transactions.find(doc => doc._id === transaction._id)
    updatedTransation.read.should.deepEqual({ requester: true, owner: true })
  })

  it('should not update when requested by a user not involved in transaction', async () => {
    const { transaction } = await createTransaction()
    await authReqC('put', endpoint, { id: transaction._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('wrong user')
    })
  })
})
