import { buildUrl } from '#lib/utils/url'
import 'should'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { publicReq } from '../utils/utils.js'

const buildReverseClaimsUrl = (property, value) => {
  return buildUrl('/api/entities', { action: 'reverse-claims', property, value })
}

describe('entities:reverse-claims', () => {
  it('should reject wdt:P31 requests', async () => {
    await publicReq('get', buildReverseClaimsUrl('wdt:P31', 'wd:Q571'))
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('denylisted property')
    })
  })

  it('should accept allowlisted entity value properties', async () => {
    const res = await publicReq('get', buildReverseClaimsUrl('wdt:P921', 'wd:Q456'))
    res.uris.should.be.an.Array()
  })

  it('should accept allowlisted string value properties', async () => {
    const res = await publicReq('get', buildReverseClaimsUrl('wdt:P3035', '978-2-505'))
    res.uris.should.be.an.Array()
  })
})
