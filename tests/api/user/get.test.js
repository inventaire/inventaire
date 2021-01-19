require('should')
const { dataadminReq, adminReq, authReq, customAuthReq, getReservedUser } = require('../utils/utils')
const { deleteUser } = require('../utils/users')
const { getToken } = require('../utils/oauth')
const { bearerTokenReq } = require('../utils/request')
const endpoint = '/api/user'

describe('user:get', () => {
  it('should get user private data', async () => {
    const userPrivateData = await authReq('get', endpoint)
    userPrivateData._id.should.be.a.String()
    userPrivateData._rev.should.be.a.String()
    userPrivateData.username.should.be.a.String()
    userPrivateData.type.should.equal('user')
    userPrivateData.created.should.be.a.Number()
    userPrivateData.email.should.be.a.String()
    userPrivateData.validEmail.should.be.a.Boolean()
    userPrivateData.settings.should.be.an.Object()
    userPrivateData.settings.notifications.should.be.an.Object()
    userPrivateData.readToken.should.be.a.String()
    const { snapshot } = userPrivateData
    snapshot.private.should.be.an.Object()
    snapshot.network.should.be.an.Object()
    snapshot.public.should.be.an.Object()
    userPrivateData.oauth.should.be.an.Array()
  })

  it('should get delete user flag', async () => {
    const user = await getReservedUser()
    await deleteUser(user)
    const deletedUserData = await customAuthReq(user, 'get', endpoint)
    deletedUserData._id.should.equal(user._id)
    deletedUserData.type.should.equal('deletedUser')
  })

  it('should get access levels', async () => {
    const userData = await authReq('get', endpoint)
    userData.roles.should.deepEqual([])
    userData.accessLevels.should.deepEqual([])
  })

  it('should get admin access levels', async () => {
    const userData = await adminReq('get', endpoint)
    const adminAccessLevels = [ 'public', 'authentified', 'dataadmin', 'admin' ]
    userData.accessLevels.should.deepEqual(adminAccessLevels)
  })

  it('should get dataadmin access levels', async () => {
    const userData = await dataadminReq('get', endpoint)
    const dataadminAccessLevels = [ 'public', 'authentified', 'dataadmin' ]
    userData.accessLevels.should.deepEqual(dataadminAccessLevels)
  })

  describe('scope-tailored profile', () => {
    describe('wiki-stable-profile', () => {
      it.only('should only return a username and an email', async () => {
        const token = await getToken({ scope: [ 'wiki-stable-profile' ] })
        const { body } = await bearerTokenReq(token, 'get', '/api/user')
        Object.keys(body).sort().should.deepEqual([
          '_id',
          'email',
          'username',
        ])
      })
    })
  })
})
