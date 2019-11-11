CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUser, getUserB, authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem, createEditionAndItem } = require '../fixtures/items'

describe 'items:get-by-entities', ->
  it 'should get an item by its entity uri', (done)->
    createItem getUser()
    .then (item)->
      authReq 'get', "/api/items?action=by-entities&uris=#{item.entity}"
      .then (res)->
        res.items[0].entity.should.equal item.entity
        done()
    .catch undesiredErr(done)

    return

  it 'should get items by entities uris', (done)->
    Promise.all [
      createEditionAndItem getUser()
      createEditionAndItem getUser()
    ]
    .then (items)->
      uris = _.uniq _.map(items, 'entity')
      _.log uris, 'uris'
      authReq 'get', "/api/items?action=by-entities&uris=#{uris.join('|')}"
      .then (res)->
        resUserIds = _.uniq _.map(res.items, 'entity')
        resUserIds.should.containDeep uris
        done()
    .catch undesiredErr(done)

    return
