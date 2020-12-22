const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUserGetter, customAuthReq } = __.require('apiTests', 'utils/utils')
const { Wait } = __.require('lib', 'promises')
const geolocatedUser1Promise = getUserGetter('geo1', null, { position: [ 1, 1 ] })().then(Wait(2000))
const geolocatedUser2Promise = getUserGetter('geo2', null, { position: [ 40, 40 ] })().then(Wait(2000))
const endpoint = '/api/users?action=nearby'

describe('users:nearby', () => {
  it('should get users nearby', async () => {
    const user1 = await geolocatedUser1Promise
    const { users } = await customAuthReq(geolocatedUser2Promise, 'get', endpoint)
    const usersIds = _.map(users, '_id')
    usersIds.includes(user1._id).should.be.true()
  })

  it('should accept a range', async () => {
    const user1 = await geolocatedUser1Promise
    const { users } = await customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1`)
    const usersIds = _.map(users, '_id')
    usersIds.includes(user1._id).should.be.false()
  })
})
