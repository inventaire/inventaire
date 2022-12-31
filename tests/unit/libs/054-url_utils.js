import { buildUrl } from 'lib/utils/url'
import 'should'

describe('url utils', () => {
  describe('buildUrl', () => {
    it('should return a string with parameters', () => {
      const path = buildUrl('/api', { action: 'man' })
      path.should.be.a.String()
      path.should.equal('/api?action=man')
    })

    it('should not add empty parameters', () => {
      const path = buildUrl('/api', { action: 'man', boudu: null })
      path.should.equal('/api?action=man')
    })

    it('should URI encode special characters', () => {
      buildUrl('/api', { key: '?!MM%**', email: 'fo+o@bar.baz' })
      .should.equal('/api?key=%3F%21MM%25**&email=fo%2Bo%40bar.baz')
      buildUrl('/api', { url: 'https://developer.mozilla.org/fr/docs/Web/API/URLSearchParams' })
      .should.equal('/api?url=https%3A%2F%2Fdeveloper.mozilla.org%2Ffr%2Fdocs%2FWeb%2FAPI%2FURLSearchParams')
    })
  })
})
