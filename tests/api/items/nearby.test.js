CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ getUserGetter, customAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem } = require '../fixtures/items'
geolocatedUser1Promise = getUserGetter('geo1', false, { position: [ 1, 1 ] })().delay 1000
geolocatedUser2Promise = getUserGetter('geo2', false, { position: [ 2, 2 ] })().delay 1000
endpoint = '/api/items?action=nearby'

describe 'items:nearby', ->
  it 'should get items nearby', (done)->
    createItem geolocatedUser1Promise
    .delay 500
    .then (item)->
      customAuthReq geolocatedUser2Promise, 'get', endpoint
      .then (res)->
        itemsIds = _.map res.items, '_id'
        itemsIds.includes(item._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should accept a range', (done)->
    createItem geolocatedUser1Promise
    .delay 500
    .then (item)->
      customAuthReq geolocatedUser2Promise, 'get', "#{endpoint}&range=1&strict-range=true"
      .then (res)->
        itemsIds = _.map res.items, '_id'
        itemsIds.includes(item._id).should.be.false()
        done()
    .catch undesiredErr(done)

    return
