CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
isbn_ = __.require 'lib', 'isbn/isbn'

describe 'isbn', ->
  # Test only what was added on top of the isbn2 module
  describe 'parse', ->
    it 'should return a ISBN data object', (done)->
      data = isbn_.parse '9788420646657'
      data.should.be.an.Object()
      data.isbn13.should.equal '9788420646657'
      done()

    it 'should recover truncated ISBN-13', (done)->
      isbn_.parse('8420646657').should.be.an.Object()
      done()
