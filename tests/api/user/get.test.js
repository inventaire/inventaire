require('should')
const { authReq } = require('../utils/utils')
const endpoint = '/api/user'

describe('user:get', () => {
  it('should get user private data', async () => {
    const userPrivateData = await authReq('get', endpoint)
    userPrivateData._id.should.be.a.String()
    userPrivateData._rev.should.be.a.String()
    userPrivateData.username.should.be.a.String()
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
})
