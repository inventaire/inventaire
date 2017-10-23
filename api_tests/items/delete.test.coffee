CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, getUser, undesiredErr } = require '../utils/utils'
{ newItemBase, CountChange } = require './helpers'
debounceDelay = CONFIG.itemsCountDebounceTime + 100

describe 'items:delete', ->
  it 'should delete an item', (done)->
    authReq 'post', '/api/items', newItemBase()
    .then (item)->
      authReq 'delete', "/api/items?id=#{item._id}"
      .then (res)->
        res.ok.should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should trigger an update of the users items counters', (done)->
    authReq 'post', '/api/items', newItemBase()
    # Delay to let the time to the item counter to be updated
    .delay debounceDelay
    .then (item)->
      getUser()
      .then (userBefore)->
        authReq 'delete', "/api/items?id=#{item._id}"
        # Delay to request the user after its items count was updated
        .delay debounceDelay
        .then (res)->
          getUser()
          .then (userAfter)->
            countChange = CountChange userBefore.snapshot, userAfter.snapshot
            countChange('private').should.equal -1
            countChange('network').should.equal 0
            countChange('public').should.equal 0
            done()
    .catch undesiredErr(done)

    return
