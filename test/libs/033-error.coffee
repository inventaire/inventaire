__ = require('config').universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect

error_ = __.require 'lib', 'error/error'

describe 'error_', ->
  describe 'new', ->
    it "should return an Error object", (done)->
      err = error_.new('doh', 500)
      err.should.be.an.Object
      (err instanceof Error).should.equal true
      done()

    it "should have a message property", (done)->
      err = error_.new('doh', 500)
      err.message.should.equal 'doh'
      done()

    it "should convert a number filter into a status code", (done)->
      err = error_.new('doh', 456)
      err.status.should.equal 456
      expect(err.type).to.be.undefined
      done()

    it "should convert a string filter into an error type", (done)->
      err = error_.new('doh', 'pinaiz')
      err.type.should.equal 'pinaiz'
      expect(err.status).to.be.undefined
      done()

    it "should pass following arguments as an array of context", (done)->
      err = error_.new('doh', 'pinaiz', 'pizza', 'macharoni')
      err.type.should.equal 'pinaiz'
      expect(err.status).to.be.undefined
      err.context.should.be.an.Array
      err.context.length.should.equal 2
      err.context[0].should.equal 'pizza'
      err.context[1].should.equal 'macharoni'
      done()

  describe 'ErrorHandler', ->
    it "should return a function", (done)->
      error_.handler.should.be.a.Function
      error_.Handler.should.be.a.Function
      error_.Handler('yo').should.be.a.Function
      done()

  describe 'reject', ->
    it "should return a promise", (done)->
      failed = error_.reject('doh', 500)
      failed.should.be.an.Object
      failed.then.should.be.a.Function
      failed.catch (err)->
        err.message.should.equal 'doh'
        err.status.should.equal 500
        done()
