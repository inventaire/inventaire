const _ = require('builders/utils')
const should = require('should')
const { authReq, getUser, getUserB, customAuthReq, getReservedUser } = require('../utils/utils')
const { getUsersNearPosition } = require('../utils/users')
const { getRefreshedUser } = require('../fixtures/users')
const endpoint = '/api/user'
const randomString = require('lib/utils/random_string')

describe('user:update', () => {
  it('should update a user', async () => {
    const user = await getReservedUser()
    const attribute = 'username'
    const value = randomString(6)
    await customAuthReq(user, 'put', endpoint, { attribute, value })
    const updatedUser = await getRefreshedUser(user)
    updatedUser[attribute].should.equal(value)
  })

  describe('position', () => {
    const attribute = 'position'
    const value = [ 10, 10 ]

    it('should update the position', async () => {
      const user = await getReservedUser()
      await customAuthReq(user, 'put', endpoint, { attribute, value })
      const updatedUser = await getRefreshedUser(user)
      updatedUser[attribute].should.deepEqual(value)
    })

    it('should truncate the coordinates', async () => {
      const user = await getReservedUser()
      await customAuthReq(user, 'put', endpoint, { attribute, value: [ 10.123456, 10.123456 ] })
      const updatedUser = await getRefreshedUser(user)
      updatedUser[attribute].should.deepEqual([ 10.12346, 10.12346 ])
    })

    it('should allow to delete the position by passing null', async () => {
      const user = await getReservedUser()
      await customAuthReq(user, 'put', endpoint, { attribute, value })
      const updatedUser = await getRefreshedUser(user)
      updatedUser[attribute].should.deepEqual(value)
      await customAuthReq(user, 'put', endpoint, { attribute, value: null })
      const reupdatedUser = await getRefreshedUser(user)
      should(reupdatedUser[attribute]).not.be.ok()
    })

    it('should update the position index', async () => {
      await authReq('put', endpoint, { attribute, value })
      const user = await getUser()
      const userB = await getUserB()
      const foundUsers = await getUsersNearPosition(value, userB)
      _.map(foundUsers, '_id').should.containEql(user._id)
      await authReq('put', endpoint, { attribute, value: null })
      const foundUsersAfterDeletedPosition = await getUsersNearPosition(value, userB)
      _.map(foundUsersAfterDeletedPosition, '_id').should.not.containEql(user._id)
    })
  })
})
