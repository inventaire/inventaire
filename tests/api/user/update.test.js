const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { customAuthReq, authReq, getReservedUser } = require('../utils/utils')
const { getRefreshedUser } = require('../fixtures/users')
const endpoint = '/api/user'
const randomString = __.require('lib', 'utils/random_string')

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
      const user = await getReservedUser()
      await customAuthReq(user, 'put', endpoint, { attribute, value })
      const foundUsersIds = await getUserIdsByPosition(value)
      foundUsersIds.should.containEql(user._id)
      await customAuthReq(user, 'put', endpoint, { attribute, value: null })
      const foundUsersIdsAfterDeletedPosition = await getUserIdsByPosition(value)
      foundUsersIdsAfterDeletedPosition.should.not.containEql(user._id)
    })
  })
})

const getUserIdsByPosition = async position => {
  const [ lat, lng ] = position
  const bbox = [ lng - 0.1, lat - 0.1, lng + 0.1, lat + 0.1 ]
  const url = `/api/users?action=search-by-position&bbox=${JSON.stringify(bbox)}`
  const { users } = await authReq('get', url)
  return _.map(users, '_id')
}
