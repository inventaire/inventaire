import 'should'
import { isLocalActivityPubActorUrl } from '#lib/boolean_validations'
import { buildUrl } from '#lib/utils/url'
import { publicOrigin } from '#server/config'

describe('boolean validations', () => {
  describe('isLocalActivityPubActorUrl', () => {
    it('should reject an undefined url', () => {
      isLocalActivityPubActorUrl().should.be.false()
    })

    it('should reject a non-url', () => {
      isLocalActivityPubActorUrl('foo').should.be.false()
    })

    it('should reject a URL from another origin', () => {
      const url = buildUrl('http://example.org/api/activitypub', { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url).should.be.false()
    })

    it('should reject a URL targeting another endpoint', () => {
      const url = buildUrl(`${publicOrigin}/api/tests`, { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url).should.be.false()
      const url2 = buildUrl(`${publicOrigin}/tests`, { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url2).should.be.false()
    })

    it('should reject a URL without a name parameter', () => {
      const url = buildUrl(`${publicOrigin}/api/activitypub`, { action: 'actor', name: '' })
      isLocalActivityPubActorUrl(url).should.be.false()
    })

    it('should accept an actor URL', () => {
      const url = buildUrl(`${publicOrigin}/api/activitypub`, { action: 'actor', name: 'someusername' })
      isLocalActivityPubActorUrl(url).should.be.true()
    })
  })
})
