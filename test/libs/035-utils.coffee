__ = require('config').universalPath
_ = __.require 'builders', 'utils'

should = require 'should'

describe 'UTILS', ->
  describe 'env', ->
    it "should have shared utils, loggers, types, tests and misc utils", (done)->
      _.type.should.be.a.Function()
      _.types.should.be.a.Function()
      _.isLocalImg.should.be.a.Function()
      _.Full.should.be.a.Function()
      done()

  describe 'hashCode', ->
    it "should return a hash", (done)->
      _.hashCode('whatever').should.be.a.Number()
      done()
