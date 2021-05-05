require('should')
const { authReq, authReqB } = require('../utils/utils')
const { newItemBase } = require('./helpers')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')

describe('items:bulk-update', () => {
  it('should update items details', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    const newTransaction = 'lending'
    item.transaction.should.not.equal(newTransaction)
    const ids = [ item._id ]
    const res = await authReq('put', '/api/items?action=bulk-update', {
      ids,
      attribute: 'transaction',
      value: newTransaction
    })
    res.ok.should.be.true()
    const { items: updatedItems } = await authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
    updatedItems[0].transaction.should.equal(newTransaction)
  })

  it('should not update items from another owner', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    const ids = [ item._id ]
    try {
      await authReqB('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'transaction',
        value: 'lending'
      })
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('user is not item owner')
    }
  })

  it('should not update shelves attribute', async () => {
    // as there is no way to know what to do with the value
    const item = await authReq('post', '/api/items', newItemBase())
    const ids = [ item._id ]
    try {
      const updatedItems = await authReq('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'shelves',
        value: 'whatever'
      })
      shouldNotBeCalled(updatedItems)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid attribute')
    }
  })
})
