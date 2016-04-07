CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ expect } = require 'chai'

{ testDataType } = __.require 'controllers','entities/lib/properties'

describe 'properties', ->
  describe 'testDataType', ->
    it 'should return false when passed the wrong type', (done)->
      testDataType('P50', 123).should.equal false
      testDataType('P212', null).should.equal false
      done()

    it 'should return true when passed the right type', (done)->
      testDataType('P50', 'not a qid but a proper string').should.equal true
      testDataType('P212', 'not an isbn but a proper string').should.equal true
      done()
