const { rawRequest } = require('../utils/request')

require('should')

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
      res.headers['access-control-allow-credentials'].should.equal('false')
    })
  })
})
