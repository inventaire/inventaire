CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
randomString = __.require 'lib', 'utils/random_string'

describe 'random string', ->
  describe 'single argument', ->
    it 'should return a string of the requested length', (done)->
      randomString(2).length.should.equal 2
      randomString(32).length.should.equal 32
      randomString(623).length.should.equal 623
      done()

  describe 'two arguments', ->
    it 'should return a string of length between the passed lengths', (done)->
      should(32 <= randomString(32, 42).length <= 42).be.true()
      should(623 <= randomString(623, 712).length <= 712).be.true()
      # Will fail once in a while
      should(randomString(1, 10000).length is 1).be.false()
      done()
