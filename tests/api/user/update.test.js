const should = require('should')
const { customAuthReq, getReservedUser } = require('../utils/utils')
const { getRefreshedUser } = require('../fixtures/users')
const { getToken } = require('../utils/oauth')
const { bearerTokenReq } = require('../utils/request')
const { shouldNotBeCalled } = require('../../unit/utils')
const endpoint = '/api/user'
const randomString = require('lib/utils/random_string')
const { getIndexedDoc } = require('../utils/search')
const { wait } = require('lib/promises')
const { users: usersIndex } = require('controllers/search/lib/indexes').indexes

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

    it('should round the coordinates', async () => {
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
      await wait(500)
      const result = await getIndexedDoc(usersIndex, user._id)
      result._source.position.lat.should.equal(10)
      result._source.position.lon.should.equal(10)
      await customAuthReq(user, 'put', endpoint, { attribute, value: null })
      await wait(500)
      const updatedResult = await getIndexedDoc(usersIndex, user._id)
      should(updatedResult._source.position).not.be.ok()
    })
  })

  describe('username', () => {
    it('should reject an update to an existing username', async () => {
      const [ userA, userB ] = await Promise.all([ getUser(), getUserB() ])
      await customAuthReq(userA, 'put', endpoint, {
        attribute: 'username',
        value: userB.username
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('this username is already used')
      })
    })

    it('should reject an update to an existing stableUsername', async () => {
      const userA = await getUser()
      const userB = await getReservedUser()
      const initialUsername = userB.username
      const token = await getToken({ user: userB, scope: [ 'stable-username' ] })
      // Trigger the creation of a stableUsername
      await bearerTokenReq(token, 'get', '/api/user')
      await customAuthReq(userB, 'put', endpoint, {
        attribute: 'username',
        value: initialUsername + 'a'
      })
      await customAuthReq(userA, 'put', endpoint, {
        attribute: 'username',
        value: initialUsername
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('this username is already used')
      })
    })
  })
})
