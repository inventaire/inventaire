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

  describe 'Complete', ->
    it "should return a function", (done)->
      cb = -> console.log arguments
      fn = _.Complete(cb, null, 1, 2, 3, 'whatever')
      fn.should.be.a.Function
      done()

    it "should not accept other argumens", (done)->
      sum = (args...)-> return args.reduce (a, b)-> a+b
      fn = _.Complete(sum, null, 1, 2, 3)
      fn(4, 5, 6, 7, 8).should.equal 6
      fn(4568).should.equal 6
      done()
