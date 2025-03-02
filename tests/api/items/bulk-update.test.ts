import 'should'
import { createGroup } from '#fixtures/groups'
import { createItem } from '#fixtures/items'
import { createShelf } from '#fixtures/shelves'
import { wait } from '#lib/promises'
import { getItem } from '#tests/api/utils/items'
import { getUser, authReq, authReqB, getUserB } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('items:bulk-update', () => {
  it('should update items attributes', async () => {
    const item = await createItem(getUser(), { transaction: 'giving' })
    const newTransaction = 'lending'
    const ids = [ item._id ]
    await authReq('put', '/api/items?action=bulk-update', {
      ids,
      attribute: 'transaction',
      value: newTransaction,
    })
    const { items: updatedItems } = await authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
    updatedItems[0].transaction.should.equal(newTransaction)
  })

  it('should reject invalid items attributes', async () => {
    const item = await createItem()
    await authReq('put', '/api/items?action=bulk-update', {
      ids: [ item._id ],
      attribute: 'transaction',
      value: 'zalgo',
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
      value: [ 'groups' ],
    })
    const { items: updatedItems } = await authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
    updatedItems[0].visibility.should.deepEqual([ 'groups' ])
  })

  it('should not update items from another owner', async () => {
    const item = await createItem()
    const ids = [ item._id ]
    try {
      await authReqB('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'transaction',
        value: 'lending',
      })
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('user is not item owner')
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

  describe('visibility', () => {
    it('should reject an invalid visibility value', async () => {
      const group = await createGroup({ user: getUserB() })
      const item = await createItem(getUser(), { visibility: [ 'friends' ] })
      const ids = [ item._id ]
      await authReq('put', '/api/items?action=bulk-update', {
        ids,
        attribute: 'visibility',
        value: [ `group:${group._id}` ],
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.body.status_verbose.should.equal('user is not in that group')
        err.statusCode.should.equal(400)
      })
    })
  })

  describe('shelves', () => {
    it('should update shelves', async () => {
      const { shelf } = await createShelf()
      const item = await createItem()
      const { _id: itemId } = item
      await authReq('put', '/api/items?action=bulk-update', {
        ids: itemId,
        attribute: 'shelves',
        value: [ shelf._id ],
      })
      const updatedItem = await getItem(item)
      updatedItem.shelves.should.deepEqual([ shelf._id ])
    })

    it('should reject adding different owner shelves', async () => {
      const { shelf } = await createShelf(getUserB())
      const item = await createItem()
      await authReq('put', '/api/items?action=bulk-update', {
        ids: item._id,
        attribute: 'shelves',
        value: [ shelf._id ],
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.body.status_verbose.should.startWith('invalid owner')
        err.statusCode.should.equal(400)
      })
    })
  })
})
