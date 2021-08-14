const should = require('should')
const { rawRequest } = require('../utils/request')

describe('CORS', () => {
  describe('OPTIONS', () => {
    it('should always answer with a 200', async () => {
      const res = await rawRequest('options', '/api/whatever')
      res.statusCode.should.equal(200)
    })

    it('should return access control headers', async () => {
      const res = await rawRequest('options', '/api/whatever')
      res.headers['access-control-allow-origin'].should.equal('*')
      res.headers['access-control-allow-methods'].should.equal('*')
      res.headers['access-control-allow-headers'].should.equal('content-type')
      should(res.headers['access-control-allow-credentials']).not.be.ok()
    })

    it('should not return session cookies', async () => {
      const res = await rawRequest('options', '/api/whatever')
      should(res.headers['set-cookie']).not.be.ok()
    })
  })
})
