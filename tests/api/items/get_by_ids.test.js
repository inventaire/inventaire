CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUser, authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem, createItems } = require '../fixtures/items'

describe 'items:get-by-ids', ->
  it 'should get an item by id', (done)->
    createItem getUser()
    .then (item)->
      authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
      .then (res)->
        res.items[0]._id.should.equal item._id
        done()
    .catch undesiredErr(done)

    return

  it 'should get items by ids', (done)->
    emptyItemsData = [ {}, {}, {} ]
    createItems getUser(), emptyItemsData
    .then (items)->
      ids = _.map(items, '_id').sort()
      authReq 'get', "/api/items?action=by-ids&ids=#{ids.join('|')}"
      .then (res)->
        resIds = _.map(res.items, '_id').sort()
        resIds.should.deepEqual ids
        resIds.length.should.equal ids.length
        done()
    .catch undesiredErr(done)

    return

  it 'should include users if requested', (done)->
    createItem getUser()
    .then (item)->
      authReq 'get', "/api/items?action=by-ids&ids=#{item._id}&include-users=true"
      .then (res)->
        res.items[0]._id.should.equal item._id
        res.users[0]._id.should.equal item.owner
        done()
    .catch undesiredErr(done)

    return
