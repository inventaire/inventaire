require('should')
const { rawRequest } = require('../utils/request')

const endpoint = '/.well-known/host-meta'

describe('host-meta', () => {
  it('should return some xml content', async () => {
    const { body, headers } = await rawRequest('get', endpoint)
    headers['content-type'].should.equal('application/xrd+xml; charset=utf-8')
    body.startsWith('<?xml').should.be.true()
  })
})
