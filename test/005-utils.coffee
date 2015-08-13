__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'


describe 'UTILS', ->
  describe 'env', ->
    it "should have loggers, types and misc utils", (done)->
      console.log '_', _
      console.log '_.types', _.types
      _.type.should.be.a.Function
      _.types.should.be.a.Function
      done()

  describe 'hashCode', ->
    it "should return a hash", (done)->
      _.hashCode('whatever').should.be.a.Number
      done()
