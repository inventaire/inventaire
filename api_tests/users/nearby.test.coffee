CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUserGetter, customAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
getGeolocatedUser1 = getUserGetter 'geo1', false, { position: [ 1, 1 ] }
getGeolocatedUser2 = getUserGetter 'geo2', false, { position: [ 40, 40 ] }
endpoint = '/api/users?action=nearby'

describe 'users:nearby', ->
  it 'should get users nearby', (done)->
    getGeolocatedUser1()
    .then (user1)->
      customAuthReq getGeolocatedUser2(), 'get', endpoint
      .then (res)->
        usersIds = _.pluck res.users, '_id'
        usersIds.includes(user1._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should accept a range', (done)->
    getGeolocatedUser1()
    .then (user1)->
      customAuthReq getGeolocatedUser2(), 'get', "#{endpoint}&range=1"
      .then (res)->
        usersIds = _.pluck res.users, '_id'
        usersIds.includes(user1._id).should.be.false()
        done()
    .catch undesiredErr(done)

    return
