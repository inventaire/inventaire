const CONFIG = require('config')
const should = require('should')
const { authReq, getUser } = require('../utils/utils')
const { newItemBase, CountChange } = require('./helpers')
const debounceDelay = CONFIG.itemsCountDebounceTime + 100

describe('items:update', () => {
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
    .delay(debounceDelay)
    .then(item => {
      return getUser()
      .then(userBefore => {
        let newListing
        item.listing.should.equal('private')
        item.listing = (newListing = 'public')
        return authReq('put', '/api/items', item)
        // Delay to request the user after its items count was updated
        .delay(debounceDelay)
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
})
