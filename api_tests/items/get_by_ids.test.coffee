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
    createItems getUser(), [ {}, {}, {} ]
    .then (items)->
      ids = _.pluck items, '_id'
      authReq 'get', "/api/items?action=by-ids&ids=#{ids.join('|')}"
      .then (res)->
        resIds = _.pluck res.items, '_id'
        resIds.should.deepEqual ids
        res.total.should.equal ids.length
        done()
    .catch undesiredErr(done)

    return
