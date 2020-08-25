const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const isbn_ = __.require('lib', 'isbn/isbn')

describe('isbn', () => {
  // Test only what was added on top of the isbn3 module
  describe('parse', () => {
    it('should return a ISBN data object', () => {
      const data = isbn_.parse('9788420646657')
      data.should.be.an.Object()
      data.isbn13.should.equal('9788420646657')
    })

    it('should recover truncated ISBN-13', () => {
      isbn_.parse('8420646657').should.be.an.Object()
    })
  })
})
