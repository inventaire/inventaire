const should = require('should')
const { getClient } = require('../utils/oauth')
const { publicReq } = require('../utils/utils')
const endpoint = '/api/oauth/clients?action=by-ids'

describe('oauth:clients:get-by-ids', () => {
  it('should return public client data', async () => {
    const scope = [ 'username', 'email' ]
    const { _id: clientId, redirectUris } = await getClient({ scope })
    const { clients } = await publicReq('get', `${endpoint}&ids=${clientId}`)
    const client = clients[clientId]
    client.should.be.an.Object()
    client._id.should.equal(clientId)
    client.scope.should.deepEqual(scope)
    client.redirectUris.should.deepEqual(redirectUris)
    client.name.should.be.a.String()
    client.description.should.be.a.String()
    should(client.secret).not.be.ok()
  })
})
