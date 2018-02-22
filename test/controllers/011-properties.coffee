CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

{ validateDataType } = __.require 'controllers', 'entities/lib/properties'

describe 'properties', ->
  describe 'validateDataType', ->
    it 'should return false when passed the wrong type', (done)->
      validateDataType('wdt:P50', 123).should.equal false
      validateDataType('wdt:P212', null).should.equal false
      done()

    it 'should return true when passed the right type', (done)->
      validateDataType('wdt:P50', 'not a qid but a proper string').should.equal true
      validateDataType('wdt:P212', 'not an isbn but a proper string').should.equal true
      done()
