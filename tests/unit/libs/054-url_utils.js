const { buildUrl } = require('lib/utils/url')
require('should')

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

    it('should stringify object value', () => {
      const path = buildUrl('/api', { action: 'man', data: { a: [ 'abc', 2 ] } })
      path.should.equal('/api?action=man&data={"a":["abc",2]}')
    })

    it('should URI encode object values problematic query string characters', () => {
      const data = { a: 'some string with ?!MM%** problematic characters' }
      const path = buildUrl('/api', { data })
      path.should.equal('/api?data={"a":"some string with %3F!MM%** problematic characters"}')
    })
  })
})
