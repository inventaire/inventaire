const CONFIG = require('config')
const __ = CONFIG.universalPath
const { Wait } = __.require('lib', 'promises')
const should = require('should')
const { authReq, authReqB, getUser, getUserB } = require('../utils/utils')
const { newItemBase, CountChange } = require('./helpers')
const { createShelf } = require('../fixtures/shelves')
const debounceDelay = CONFIG.itemsCountDebounceTime + 100
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')

describe('items:update', () => {
  it('should reject invalid item id', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    item._id = 'invalidid'
    try {
      const newItem = await authReq('put', '/api/items', item)
      shouldNotBeCalled(newItem)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid _id')
    }
  })

  it('should reject invalid entity', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    item.entity = 'inv:aliduri'
    try {
      const newItem = await authReq('put', '/api/items', item)
      shouldNotBeCalled(newItem)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid entity')
    }
  })

  it('should update an item', done => {
    authReq('post', '/api/items', newItemBase())
    .then(item => {
      let newDetails, newTransaction
      item.transaction = (newTransaction = 'lending')
      item.details = (newDetails = 'hello')
      return authReq('put', '/api/items', item)
      .then(updatedItem => {
        updatedItem.transaction.should.equal(newTransaction)
        updatedItem.details.should.equal(newDetails)
        done()
      })
    })
    .catch(done)
  })

  it('should not be able to update non updatable attributes', done => {
    authReq('post', '/api/items', newItemBase())
    .then(item => {
      item.busy = true
      return authReq('put', '/api/items', item)
      .then(updatedItem => {
        should(updatedItem.busy).not.be.ok()
        done()
      })
    })
    .catch(done)
  })

  it('should trigger an update of the users items counters', done => {
    authReq('post', '/api/items', newItemBase())
    // Delay to let the time to the item counter to be updated
    .then(Wait(debounceDelay))
    .then(item => {
      return getUser()
      .then(userBefore => {
        let newListing
        item.listing.should.equal('private')
        item.listing = (newListing = 'public')
        return authReq('put', '/api/items', item)
        // Delay to request the user after its items count was updated
        .then(Wait(debounceDelay))
        .then(updatedItem => {
          updatedItem.listing.should.equal(newListing)
          return getUser()
          .then(userAfter => {
            const countChange = CountChange(userBefore.snapshot, userAfter.snapshot)
            countChange('private').should.equal(-1)
            countChange('network').should.equal(0)
            countChange('public').should.equal(1)
            done()
          })
        })
      })
    })
    .catch(done)
  })

  it('should reject item from another owner', async () => {
    const item = await authReqB('post', '/api/items', newItemBase())
    item.listing = 'public'
    try {
      const newItem = await authReq('put', '/api/items', item)
      shouldNotBeCalled(newItem)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('user isnt item.owner')
    }
  })

  it('should reject item with a shelf from another owner', async () => {
    const item = await authReq('post', '/api/items', newItemBase())
    const shelf = await createShelf(getUserB())
    item.shelves = [ shelf._id ]
    try {
      const newItem = await authReq('put', '/api/items', item)
      shouldNotBeCalled(newItem)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid owner')
    }
  })
})
