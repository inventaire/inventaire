CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

{ testDataType } = __.require 'controllers', 'entities/lib/properties'

describe 'properties', ->
  describe 'testDataType', ->
    it 'should return false when passed the wrong type', (done)->
      testDataType('wdt:P50', 123).should.equal false
      testDataType('wdt:P212', null).should.equal false
      done()

    it 'should return true when passed the right type', (done)->
      testDataType('wdt:P50', 'not a qid but a proper string').should.equal true
      testDataType('wdt:P212', 'not an isbn but a proper string').should.equal true
      done()
