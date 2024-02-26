import CONFIG from 'config'
import { wait } from '#lib/promises'
import 'should'
import { forceArray } from '#lib/utils/base'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createItem } from '../fixtures/items.js'
import { authReq, authReqB, getUser } from '../utils/utils.js'
import { CountChange } from './helpers.js'

const debounceDelay = CONFIG.itemsCountDebounceTime + 500

const deleteByIds = (ids, authReqFn) => {
  if (!authReqFn) { authReqFn = authReq }
  ids = forceArray(ids)
  return authReqFn('post', '/api/items?action=delete-by-ids', { ids })
}

describe('items:delete-by-ids', () => {
  it('should reject an empty list of ids', async () => {
    await deleteByIds([])
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("ids array can't be empty")
    })
  })

  it('should ignore already deleted items', async () => {
    const item = await createItem()
    const { _id: itemId } = item
    await deleteByIds(itemId)
    await deleteByIds(itemId)
  })

  it('should delete an item', async () => {
    const item = await createItem()
    const { _id: itemId } = item
    await deleteByIds(itemId)
    const { items } = await authReq('get', `/api/items?action=by-ids&ids=${itemId}`)
    items.length.should.equal(0)
  })

  it('should trigger an update of the users items counters', async () => {
    const item = await createItem()
    // Delay to let the time to the item counter to be updated
    await wait(debounceDelay)
    const userBefore = await getUser()
    await deleteByIds(item._id)
    // Delay to request the user after its items count was updated
    await wait(debounceDelay)
    const userAfter = await getUser()
    const countChange = CountChange(userBefore.snapshot, userAfter.snapshot)
    countChange('public').should.equal(-1)
  })

  it('should reject deletion of an item owned by another user', async () => {
    const item = await createItem()
    const { _id: itemId } = item
    await deleteByIds(itemId, authReqB)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal("user isn't item owner")
    })
  })
})
