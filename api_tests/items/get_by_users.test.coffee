CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUser, getUserB, authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem, createItems } = require '../fixtures/items'

describe 'items:get-by-users', ->
  it 'should get an item by id', (done)->
    createItem getUser()
    .then (item)->
      authReq 'get', "/api/items?action=by-users&users=#{item.owner}"
      .then (res)->
        res.items[0]._id.should.equal item._id
        done()
    .catch undesiredErr(done)

    return

  it 'should get items by ids', (done)->
    Promise.all [
      createItem getUser(), { listing: 'public' }
      createItem getUserB(), { listing: 'public' }
    ]
    .then (items)->
      userIds = _.pluck items, 'owner'
      authReq 'get', "/api/items?action=by-users&users=#{userIds.join('|')}"
      .then (res)->
        resUserIds = _.uniq _.pluck(res.items, 'owner')
        resUserIds.should.containDeep userIds
        done()
    .catch undesiredErr(done)

    return

  it "should get items by ids with a filter set to 'group'", (done)->
    Promise.all [
      createItem getUser(), { listing: 'public' }
      createItem getUserB(), { listing: 'public' }
    ]
    .then (items)->
      userIds = _.pluck items, 'owner'
      authReq 'get', "/api/items?action=by-users&users=#{userIds.join('|')}&filter=group"
      .then (res)->
        resUserIds = _.uniq _.pluck(res.items, 'owner')
        resUserIds.should.containDeep userIds
        done()
    .catch undesiredErr(done)

    return
