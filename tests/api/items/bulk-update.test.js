require('should')
const { getUser, authReq, authReqB } = require('../utils/utils')
const { newItemBase } = require('./helpers')
const { createItem } = require('../fixtures/items')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { wait } = require('lib/promises')

describe('items:bulk-update', () => {
  it('should update items attributes', async () => {
    const item = await createItem(getUser(), { transaction: 'giving' })
    const newTransaction = 'lending'
    const ids = [ item._id ]
    await authReq('put', '/api/items?action=bulk-update', {
      ids,
      attribute: 'transaction',
      value: newTransaction
    })
    const { items: updatedItems } = await authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
    updatedItems[0].transaction.should.equal(newTransaction)
  })

  it('should reject invalid items attributes', async () => {
    const item = await createItem()
    await authReq('put', '/api/items?action=bulk-update', {
      ids: [ item._id ],
      attribute: 'transaction',
      value: 'zalgo'
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('invalid_transaction')
    })
  })

  it('should update items attributes', async () => {
    const item = await createItem(getUser(), { visibility: [ 'friends' ] })
    const ids = [ item._id ]
    await authReq('put', '/api/items?action=bulk-update', {
      ids,
      attribute: 'visibility',
      value: [ 'groups' ]
    })
    const { items: updatedItems } = await authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
    updatedItems[0].visibility.should.deepEqual([ 'groups' ])
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

  it('should retry before rejecting rapid updates', async () => {
    const item = await createItem(getUser(), { visibility: [] })
    const ids = [ item._id ]
    const attribute = 'visibility'
    await Promise.all([
      authReq('put', '/api/items?action=bulk-update', { ids, attribute, value: [ 'public' ] }),
      wait(5).then(() => authReq('put', '/api/items?action=bulk-update', { ids, attribute, value: [ 'friends' ] })),
      // If a 3rd update was attempted, the current implementation can not guarantee
      // that the last request will be the last performed
    ])
    const { items: updatedItems } = await authReq('get', `/api/items?action=by-ids&ids=${item._id}`)
    updatedItems[0].visibility.should.deepEqual([ 'friends' ])
  })
})
