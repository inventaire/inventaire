CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, authReqB, getUser, undesiredRes } = require '../utils/utils'
{ CountChange } = require './helpers'
{ createItem } = require '../fixtures/items'
debounceDelay = CONFIG.itemsCountDebounceTime + 100

deleteByIds = (ids, authReqFn)->
  authReqFn or= authReq
  ids = _.forceArray ids
  authReqFn 'post', '/api/items?action=delete-by-ids', { ids }

describe 'items:delete-by-ids', ->
  it 'should delete an item', (done)->
    createItem()
    .then (item)->
      { _id: itemId } = item
      deleteByIds itemId
      .then (res)->
        res.ok.should.be.true()
        authReq 'get', "/api/items?action=by-ids&ids=#{itemId}"
        .then (res)->
          res.items.length.should.equal 0
          done()
    .catch done

    return

  it 'should trigger an update of the users items counters', (done)->
    createItem()
    # Delay to let the time to the item counter to be updated
    .delay debounceDelay
    .then (item)->
      getUser()
      .then (userBefore)->
        deleteByIds item._id
        # Delay to request the user after its items count was updated
        .delay debounceDelay
        .then (res)->
          getUser()
          .then (userAfter)->
            countChange = CountChange userBefore.snapshot, userAfter.snapshot
            countChange('private').should.equal 0
            countChange('network').should.equal 0
            countChange('public').should.equal -1
            done()
    .catch done

    return

  it 'should reject deletion of an item owned by another user', (done)->
    createItem()
    .then (item)->
      { _id: itemId } = item
      deleteByIds itemId, authReqB
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 403
        err.body.status_verbose.should.equal "user isn't item owner"
        done()
    .catch done

    return

  it 'should reject an empty list of ids', (done)->
    deleteByIds []
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal "ids array can't be empty"
      done()
    .catch done

    return
