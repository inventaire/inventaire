CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'

should = require 'should'

{couchUuid, userId}= __.require('models', 'common-tests')


describe 'models tests', ->
  describe 'couchUuid', ->
    it "should be true on ok couch uuid", (done)->
      id = '31bdb23f92014ac20d60ce21eb00058e'
      couchUuid.test(id).should.equal true
      couchUuid.test('wat?').should.equal false
      done()

  describe 'userId', ->
    it "should equal couchUuid", (done)->
      userId.should.equal couchUuid
      done()