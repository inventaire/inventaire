CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authentifiedRequest:authreq, getUser } = require '../utils/utils'
{ newItemBase, CountChange } = require './helpers'

describe 'items:update', ->
  it 'should update an item', (done)->
    authreq 'put', '/api/items', newItemBase()
    .then (item)->
      item.transaction = newTransaction = 'lending'
      item.details = newDetails = 'hello'
      authreq 'put', '/api/items', item
      .then (updatedItem)->
        updatedItem.transaction.should.equal newTransaction
        updatedItem.details.should.equal newDetails
        done()

    return

  it 'should not be able to update non updatable attributes', (done)->
    authreq 'put', '/api/items', newItemBase()
    .then (item)->
      originalTitle = item.title
      item.title += 'bla'
      authreq 'put', '/api/items', item
      .then (updatedItem)->
        updatedItem.title.should.equal originalTitle
        done()

    return

  it 'should trigger an update of the users items counters', (done)->
    authreq 'put', '/api/items', newItemBase()
    # Delay to let the time to the item counter to be updated
    .delay 10
    .then (item)->
      getUser()
      .then (userBefore)->
        item.listing.should.equal 'private'
        item.listing = newListing = 'public'
        authreq 'put', '/api/items', item
        # Delay to request the user after its items count was updated
        .delay 10
        .then (updatedItem)->
          updatedItem.listing.should.equal newListing
          getUser()
          .then (userAfter)->
            countChange = CountChange userBefore.snapshot, userAfter.snapshot
            countChange('private').should.equal -1
            countChange('network').should.equal 0
            countChange('public').should.equal 1
            done()

    return
