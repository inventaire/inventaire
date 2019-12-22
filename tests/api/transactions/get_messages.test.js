const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { createTransaction, addMessage } = require('../fixtures/transactions')
const { authReq } = __.require('apiTests', 'utils/utils')

const endpoint = '/api/transactions?action=get-messages'

describe('transactions:get:messages', () => {
  it('should reject without id', async () => {
    try {
      const res = await authReq('get', endpoint, {})
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: transaction')
      err.statusCode.should.equal(400)
    }
  })

  it('should get a transaction messages', async () => {
    const res1 = await createTransaction()
    const { transaction } = res1
    const { _id } = transaction
    await addMessage(transaction)
    const res3 = await authReq('get', `${endpoint}&transaction=${_id}`)
    res3.messages.should.be.an.Array()
    should(res3.messages.length > 0).be.true()
  })
})
