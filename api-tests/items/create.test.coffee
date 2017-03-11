CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authentifiedRequest:authreq, getUser } = require '../utils/utils'
{ newItemBase, CountChange } = require './helpers'

describe 'items:create', ->
  it 'should create an item', (done)->
    getUser()
    .then (userBefore)->
      userId = userBefore._id
      authreq 'put', '/api/items', newItemBase()
      .then (res)->
        res.listing.should.equal 'private'
        res.transaction.should.equal 'inventorying'
        res.owner.should.equal userId
      # Delay so that the item counter update doesn't impact the following test
      .delay 10
      .then -> done()

    return

  it 'should increment the user items counter', (done)->
    getUser()
    .then (userBefore)->
      userId = userBefore._id
      authreq 'put', '/api/items', newItemBase()
      # Delay to request the user after its items count was updated
      .delay 10
      .then (res)->
        getUser()
        .then (userAfter)->
          countChange = CountChange userBefore.snapshot, userAfter.snapshot
          countChange('private').should.equal 1
          countChange('network').should.equal 0
          countChange('public').should.equal 0
          done()

    return
