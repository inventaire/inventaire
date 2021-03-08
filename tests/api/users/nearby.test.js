const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
require('should')
const { getUserGetter, customAuthReq } = require('../utils/utils')
const { waitForIndexation } = require('../utils/search')
const { getRandomPosition } = require('../fixtures/users')
const positionUser1 = getRandomPosition()
const positionUser2 = [
  positionUser1[0] - 0.1,
  positionUser1[1] - 0.1,
]
const positionUser3 = [
  positionUser1[0] - 0.11,
  positionUser1[1] - 0.11,
]
const positionUser4 = [
  positionUser1[0] - 0.12,
  positionUser1[1] - 0.12,
]
const geolocatedUser1Promise = getUserGetter('geo1', null, { position: positionUser1 })()
const geolocatedUser2Promise = getUserGetter('geo2', null, { position: positionUser2 })()
const geolocatedUser3Promise = getUserGetter('geo3', null, { position: positionUser3 })()
const geolocatedUser4Promise = getUserGetter('geo4', null, { position: positionUser4 })()
const endpoint = '/api/users?action=nearby'

describe('users:nearby', () => {
  it('should get users nearby', async () => {
    const user1 = await geolocatedUser1Promise
    await waitForIndexation('users', user1._id)
    const { users } = await customAuthReq(geolocatedUser2Promise, 'get', endpoint)
    const usersIds = _.map(users, '_id')
    usersIds.includes(user1._id).should.be.true()
  })

  it('should accept a range', async () => {
    const user1 = await geolocatedUser1Promise
    await waitForIndexation('users', user1._id)
    const { users } = await customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1`)
    const usersIds = _.map(users, '_id')
    usersIds.includes(user1._id).should.be.false()
  })

  it('should get users nearby sorted by distance', async () => {
    const user2 = await geolocatedUser2Promise
    const user3 = await geolocatedUser3Promise
    const user4 = await geolocatedUser4Promise
    await Promise.all([
      waitForIndexation('users', user2._id),
      waitForIndexation('users', user3._id),
      waitForIndexation('users', user4._id),
    ])
    const { users } = await customAuthReq(geolocatedUser1Promise, 'get', endpoint)
    const usersIds = _.map(users, '_id')
    usersIds.includes(user2._id).should.be.true()
    usersIds.includes(user3._id).should.be.true()
    usersIds.includes(user4._id).should.be.true()
    usersIds.indexOf(user2._id).should.be.below(usersIds.indexOf(user3._id))
    usersIds.indexOf(user3._id).should.be.below(usersIds.indexOf(user4._id))
  })
})
