const requests_ = require('lib/requests')
const { shouldNotBeCalled } = require('tests/api/utils/utils')
const hostname = require('os').hostname()

describe('requests:sanitize', () => {
  it('should reject ip addresses', async () => {
    await requests_.get('http://192.168.178.247/', { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })

  it('should reject ipv4 addresses with port', async () => {
    await requests_.get('http://192.168.178.247:3006/', { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })

  it('should reject ipv6 addresses with port', async () => {
    await requests_.get('http://[::1]:3006/', { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })

  it('should reject localhost', async () => {
    await requests_.get('http://localhost/', { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })

  it('should reject localhost with port', async () => {
    await requests_.get('http://localhost:3006/', { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })

  // TODO: would require to check ip ranges
  xit('should reject domain name resolving to private network', async () => {
    await requests_.get(`http://${hostname}.local:9200`, { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })
})
