__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'


describe 'UTILS', ->
  describe 'hashCode', ->
    it "should return a hash", (done)->
      _.hashCode('whatever').should.be.a.Number
      done()