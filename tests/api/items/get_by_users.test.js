CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUser, getUserB, authReq, undesiredErr, undesiredRes } = __.require 'apiTests', 'utils/utils'
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
      createItem getUser(), { listing: 'private' }
      createItem getUser(), { listing: 'public' }
      createItem getUserB(), { listing: 'public' }
    ]
    .then (items)->
      usersIds = _.map items.slice(1), 'owner'
      itemsIds = _.map items, '_id'
      authReq 'get', "/api/items?action=by-users&users=#{usersIds.join('|')}"
      .then (res)->
        resUsersIds = _.uniq _.map(res.items, 'owner')
        resUsersIds.should.containDeep usersIds
        resItemsIds = _.uniq _.map(res.items, '_id')
        resItemsIds.should.containDeep itemsIds
        done()
    .catch undesiredErr(done)

    return

  it "should get items by ids with a filter set to 'group'", (done)->
    Promise.all [
      createItem getUser(), { listing: 'private' }
      createItem getUser(), { listing: 'public' }
      createItem getUserB(), { listing: 'public' }
    ]
    .then (items)->
      privateItemId = items[0]._id
      usersIds = _.map items.slice(1), 'owner'
      authReq 'get', "/api/items?action=by-users&users=#{usersIds.join('|')}&filter=group"
      .then (res)->
        resUsersIds = _.uniq _.map(res.items, 'owner')
        resUsersIds.should.containDeep usersIds
        resItemsIds = _.uniq _.map(res.items, '_id')
        resItemsIds.should.not.containEql privateItemId
        done()
    .catch undesiredErr(done)

    return

  it "should reject invalid filters'", (done)->
    getUser()
    .then (user)->
      { _id: userId } = user
      authReq 'get', "/api/items?action=by-users&users=#{userId}&filter=bla"
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.startWith 'invalid filter'
      done()
    .catch undesiredErr(done)

    return
