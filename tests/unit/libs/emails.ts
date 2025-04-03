import 'should'
import { someRandomCouchUuid } from '#fixtures/general'
import { getSomeEmail } from '#fixtures/text'
import { getSignedPayload, getUnsubscribeUrl } from '#lib/emails/unsubscribe'
import { publicOrigin } from '#server/config'
import { buildBase64EncodedJson } from '#tests/api/utils/auth'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const somePayload = {
  user: someRandomCouchUuid(),
  email: getSomeEmail(),
  set: 'notifications.inventories_activity_summary=false',
}

describe('emails', () => {
  describe('getUnsubscribeUrl', () => {
    it('should return an unsubscribe url', () => {
      const unsubscribeUrl = getUnsubscribeUrl(somePayload)
      const parsedUrl = new URL(unsubscribeUrl)
      parsedUrl.origin.should.equal(publicOrigin)
      parsedUrl.pathname.should.equal('/api/user')
      parsedUrl.searchParams.get('data').should.equal(buildBase64EncodedJson(somePayload))
      parsedUrl.searchParams.get('sig').should.be.a.String()
      parsedUrl.searchParams.get('sig').length.should.be.above(30)
    })
  })

  describe('getSignedPayload', () => {
    it('should verify a valid unsubscribe url', () => {
      const unsubscribeUrl = getUnsubscribeUrl(somePayload)
      const parsedUrl = new URL(unsubscribeUrl)
      const { data, sig } = Object.fromEntries(parsedUrl.searchParams)
      getSignedPayload(data, sig).should.deepEqual(somePayload)
    })

    it('should reject an tampered payload', () => {
      const unsubscribeUrl = getUnsubscribeUrl(somePayload)
      const parsedUrl = new URL(unsubscribeUrl)
      const { sig } = Object.fromEntries(parsedUrl.searchParams)
      const tamperedPayload = buildBase64EncodedJson({ ...somePayload, set: 'foo' })
      try {
        const res = getSignedPayload(tamperedPayload, sig)
        shouldNotBeCalled(res)
      } catch (err) {
        err.message.should.equal('signed payload verification failed')
        err.statusCode.should.equal(400)
      }
    })

    it('should reject an tampered signature', () => {
      const unsubscribeUrl = getUnsubscribeUrl(somePayload)
      const parsedUrl = new URL(unsubscribeUrl)
      const { data, sig } = Object.fromEntries(parsedUrl.searchParams)
      try {
        const res = getSignedPayload(data, sig + '_')
        shouldNotBeCalled(res)
      } catch (err) {
        err.message.should.equal('signed payload verification failed')
        err.statusCode.should.equal(400)
      }
    })
  })
})
