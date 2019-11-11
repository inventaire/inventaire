CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUser, getUserB, authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem, createEditionAndItem } = require '../fixtures/items'
{ createUser } = require '../fixtures/users'
{ Promise } = __.require 'lib', 'promises'


endpoint = '/api/items?action=by-user-and-entity'

describe 'items:get-by-user-and-entity', ->
  it 'should get an item by its owner id and entity uri', (done)->
    createItem getUser()
    .then (item)->
      authReq 'get', "#{endpoint}&user=#{item.owner}&uri=#{item.entity}"
      .then (res)->
        itemsIds = _.map res.items, '_id'
        itemsIds.includes(item._id).should.be.true()
        for resItem in res.items
          resItem.entity.should.equal item.entity
          resItem.owner.should.equal item.owner
        done()
    .catch undesiredErr(done)

    return

  it 'should get items by their owner id', (done)->
    Promise.all [
      createEditionAndItem getUser()
      createEditionAndItem createUser()
    ]
    .spread (userItem)->
      { owner, entity: uri } = userItem
      authReq 'get', "#{endpoint}&user=#{owner}&uri=#{uri}"
      .then (res)->
        res.items.length.should.equal 1
        res.items[0].should.deepEqual userItem
        done()
    .catch undesiredErr(done)

    return

  it 'should get items by their entity uri', (done)->
    createEditionAndItem getUser()
    .then (itemA)->
      uri = itemA.entity
      createItem getUser(), { entity: uri }
      .then (itemB)->
        authReq 'get', "#{endpoint}&user=#{itemA.owner}&uri=#{uri}"
        .then (res)->
          itemsIds = [ itemA._id, itemB._id ]
          resItemsIds = _.map res.items, '_id'
          resItemsIds.should.containDeep itemsIds
          done()
    .catch undesiredErr(done)

    return
