const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { createTransaction, addMessage } = require('../fixtures/transactions')
const { authReq } = __.require('apiTests', 'utils/utils')

const endpoint = '/api/transactions?action=get-messages'

describe('transactions:get:messages', () => {
  it('should reject without id', async () => {
    try {
      await authReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: transaction')
    }
  })

  it('should get a transaction messages', async () => {
    const res1 = await createTransaction()
    const { transaction } = res1
    const { _id } = transaction
    await addMessage(transaction)
    const res2 = await authReq('get', `${endpoint}&transaction=${_id}`)
    res2.messages.should.be.an.Array()
    should(res2.messages.length > 0).be.true()
  })
})
