CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
validateObject = __.require 'lib', 'validate_object'

describe 'validate object', ->
  it 'should throw when passed an object with an invalid key', (done)->
    validKeys = [ 'b' ]
    (-> validateObject { a: 1 }, validKeys).should.throw()
    done()

  it 'should not throw when passed an object with a valid key', (done)->
    validKeys = [ 'b' ]
    (-> validateObject { b: 1 }, validKeys).should.not.throw()
    done()

  it 'should throw when passed an object with an invalid value', (done)->
    validKeys = [ 'b' ]
    (-> validateObject { b: 1 }, validKeys, 'string').should.throw()
    done()

  it 'should not throw when passed an object with a valid value', (done)->
    validKeys = [ 'b' ]
    (-> validateObject { b: 1 }, validKeys, 'number').should.not.throw()
    done()
