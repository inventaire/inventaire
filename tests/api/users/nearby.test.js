const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUserGetter, customAuthReq } = __.require('apiTests', 'utils/utils')
const { Wait } = __.require('lib', 'promises')
const geolocatedUser1Promise = getUserGetter('geo1', false, { position: [ 1, 1 ] })().then(Wait(2000))
const geolocatedUser2Promise = getUserGetter('geo2', false, { position: [ 40, 40 ] })().then(Wait(2000))
const endpoint = '/api/users?action=nearby'

describe('users:nearby', () => {
  it('should get users nearby', done => {
    geolocatedUser1Promise
    .then(user1 => {
      return customAuthReq(geolocatedUser2Promise, 'get', endpoint)
      .then(res => {
        const usersIds = _.map(res.users, '_id')
        usersIds.includes(user1._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should accept a range', done => {
    geolocatedUser1Promise
    .then(user1 => {
      return customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1`)
      .then(res => {
        const usersIds = _.map(res.users, '_id')
        usersIds.includes(user1._id).should.be.false()
        done()
      })
    })
    .catch(done)
  })
})
