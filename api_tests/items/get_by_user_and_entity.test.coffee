CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUser, getUserB, authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem, createEditionAndItem } = require '../fixtures/items'

endpoint = '/api/items?action=by-user-and-entity'

describe 'items:get-by-user-and-entity', ->
  it 'should get an item by its owner id and entity uri', (done)->
    createItem getUser()
    .then (item)->
      authReq 'get', "#{endpoint}&user=#{item.owner}&uri=#{item.entity}"
      .then (res)->
        res.items[0].entity.should.equal item.entity
        res.items[0]._id.should.equal item._id
        done()
    .catch undesiredErr(done)

    return

  it 'should get items by their owner id and entity uri', (done)->
    createEditionAndItem getUser()
    .then (itemA)->
      uri = itemA.entity
      createItem getUser(), { entity: uri }
      .then (itemB)->
        authReq 'get', "#{endpoint}&user=#{itemA.owner}&uri=#{uri}"
        .then (res)->
          itemsIds = [ itemA._id, itemB._id ]
          resItemsIds = _.pluck res.items, '_id'
          resItemsIds.should.containDeep itemsIds
          done()
    .catch undesiredErr(done)

    return
