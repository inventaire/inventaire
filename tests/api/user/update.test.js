const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { authReq, authReqB, getUser } = require('../utils/utils')
const { getRefreshedUser } = require('../fixtures/users')
const endpoint = '/api/user'
const randomString = __.require('lib', 'utils/random_string')

describe('user:update', () => {
  it('should update a user', async () => {
    const attribute = 'username'
    const value = randomString(6)
    await authReq('put', endpoint, { attribute, value })
    const updatedUser = await getRefreshedUser(getUser())
    updatedUser[attribute].should.equal(value)
  })

  describe('position', () => {
    const attribute = 'position'
    const value = [ 10, 10 ]

    it('should update the position', async () => {
      await authReq('put', endpoint, { attribute, value })
      const updatedUser = await getRefreshedUser(getUser())
      updatedUser[attribute].should.deepEqual(value)
      await authReq('put', endpoint, { attribute, value: null })
      const reupdatedUser = await getRefreshedUser(getUser())
      console.log('reupdatedUser', reupdatedUser)
      should(reupdatedUser[attribute]).not.be.ok()
    })

    it('should update the position index', async () => {
      await authReq('put', endpoint, { attribute, value })
      const user = await getUser()
      const foundUsersIds = await getUserIdsByPosition(value)
      foundUsersIds.should.containEql(user._id)
      await authReq('put', endpoint, { attribute, value: null })
      const foundUsersIdsAfterDeletedPosition = await getUserIdsByPosition(value)
      foundUsersIdsAfterDeletedPosition.should.not.containEql(user._id)
    })
  })
})

const getUserIdsByPosition = async position => {
  const [ lat, lng ] = position
  const bbox = [ lng - 0.1, lat - 0.1, lng + 0.1, lat + 0.1 ]
  const url = `/api/users?action=search-by-position&bbox=${JSON.stringify(bbox)}`
  const { users } = await authReqB('get', url)
  return _.map(users, '_id')
}
