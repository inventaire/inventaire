const CONFIG = require('config')
const requests_ = require('lib/requests')
const { shouldNotBeCalled } = require('tests/api/utils/utils')

describe('requests:sanitize', () => {
  it('should reject private URLs', async () => {
    await requests_.get(CONFIG.elasticsearch.origin, { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })
})
