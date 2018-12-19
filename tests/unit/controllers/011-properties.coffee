CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

{ validateValueType } = __.require 'controllers', 'entities/lib/properties/validations'

describe 'properties', ->
  describe 'validateValueType', ->
    it 'should return false when passed the wrong type', (done)->
      validateValueType('wdt:P50', 123).should.equal false
      validateValueType('wdt:P212', null).should.equal false
      done()

    it 'should return true when passed the right type', (done)->
      validateValueType('wdt:P50', 'not a qid but a proper string').should.equal true
      validateValueType('wdt:P212', 'not an isbn but a proper string').should.equal true
      done()
