const CONFIG = require('config')
const { wait } = require('lib/promises')
require('should')
const { authReq, authReqB, getUser, getUserB } = require('../utils/utils')
const { newItemBase, CountChange } = require('./helpers')
const { createShelf } = require('../fixtures/shelves')
const debounceDelay = CONFIG.itemsCountDebounceTime + 500
const { shouldNotBeCalled } = require('tests/api/utils/utils')

describe('items:update', () => {
  it('should reject invalid item id', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    item._id = 'invalidid'
    await authReq('put', '/api/items', item)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid _id')
    })
  })

  it('should reject invalid entity', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    item.entity = 'inv:aliduri'
    await authReq('put', '/api/items', item)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid entity')
    })
  })

  it('should update an item', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    const newTransaction = item.transaction = 'lending'
    const newDetails = item.details = 'hello'
    const updatedItem = await authReq('put', '/api/items', item)
    updatedItem.transaction.should.equal(newTransaction)
    updatedItem.details.should.equal(newDetails)
  })

  it('should not be able to update non updatable attributes', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    const { created: originalCreatedTimestamp } = item
    item.created = Date.now() - 10000
    const updatedItem = await authReq('put', '/api/items', item)
    updatedItem.created.should.equal(originalCreatedTimestamp)
  })

  it('should trigger an update of the users items counters', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    // Delay to let the time to the item counter to be updated
    await wait(debounceDelay)
    const userBefore = await getUser()
    item.listing.should.equal('private')
    const newListing = item.listing = 'public'
    const updatedItem = await authReq('put', '/api/items', item)
    // Delay to request the user after its items count was updated
    await wait(debounceDelay)
    updatedItem.listing.should.equal(newListing)
    const userAfter = await getUser()
    const countChange = CountChange(userBefore.snapshot, userAfter.snapshot)
    countChange('private').should.equal(-1)
    countChange('network').should.equal(0)
    countChange('public').should.equal(1)
  })

  it('should reject item from another owner', async () => {
    const item = await authReqB('post', '/api/items', newItemBase())
    item.listing = 'public'
    await authReq('put', '/api/items', item)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('user is not item owner')
    })
  })

  it('should reject item with an invalid shelf', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    item.shelves = [ 'not a shelf id' ]
    await authReq('put', '/api/items', item)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('invalid_shelves')
    })
  })

  it('should reject item with a shelf from another owner', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    const shelf = await createShelf(getUserB())
    item.shelves = [ shelf._id ]
    await authReq('put', '/api/items', item)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid owner')
    })
  })
})
