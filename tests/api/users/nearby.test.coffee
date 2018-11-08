CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUserGetter, customAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
geolocatedUser1Promise = getUserGetter('geo1', false, { position: [ 1, 1 ] })().delay 1000
geolocatedUser2Promise = getUserGetter('geo2', false, { position: [ 40, 40 ] })().delay 1000
endpoint = '/api/users?action=nearby'

describe 'users:nearby', ->
  it 'should get users nearby', (done)->
    geolocatedUser1Promise
    .then (user1)->
      customAuthReq geolocatedUser2Promise, 'get', endpoint
      .then (res)->
        usersIds = _.map res.users, '_id'
        usersIds.includes(user1._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should accept a range', (done)->
    geolocatedUser1Promise
    .then (user1)->
      customAuthReq geolocatedUser2Promise, 'get', "#{endpoint}&range=1"
      .then (res)->
        usersIds = _.map res.users, '_id'
        usersIds.includes(user1._id).should.be.false()
        done()
    .catch undesiredErr(done)

    return
