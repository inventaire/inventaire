import { sanitizeUrl } from '#lib/requests'
import config from '#server/config'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('requests:sanitize', () => {
  it('should reject private URLs', async () => {
    await sanitizeUrl(config.elasticsearch.origin)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })
})
