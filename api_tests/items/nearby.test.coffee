CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ getUserGetter, customAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem } = require '../fixtures/items'
getGeolocatedUser1 = getUserGetter 'geo1', false, { position: [ 1, 1 ] }
getGeolocatedUser2 = getUserGetter 'geo2', false, { position: [ 1, 1 ] }
endpoint = '/api/items?action=nearby'

describe 'items:nearby', ->
  it 'should get items nearby', (done)->
    createItem getGeolocatedUser1()
    .then (item)->
      customAuthReq getGeolocatedUser2(), 'get', endpoint
      .then (res)->
        itemsIds = _.pluck res.items, '_id'
        itemsIds.includes(item._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should accept a range', (done)->
    createItem getGeolocatedUser1()
    .then (item)->
      customAuthReq getGeolocatedUser2(), 'get', "#{endpoint}&range=1"
      .then (res)->
        itemsIds = _.pluck res.items, '_id'
        itemsIds.includes(item._id).should.be.false()
        done()
    .catch undesiredErr(done)

    return
