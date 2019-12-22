const __ = require('config').universalPath
require('should')
const { authReq, getUser } = require('../utils/utils')
const { getRefreshedUser } = require('../fixtures/users')
const endpoint = '/api/user'
const randomString = __.require('lib', 'utils/random_string')

describe('user:update', async () => {
  it('should update a user', async () => {
    const attribute = 'username'
    const value = randomString(6)
    await authReq('put', endpoint, { attribute, value })
    const updatedUser = await getRefreshedUser(getUser())
    updatedUser[attribute].should.equal(value)
  })
})
