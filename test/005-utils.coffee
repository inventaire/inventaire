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

  describe 'logs_', ->
    describe 'log', ->
      it "should return the first argument", (done)->
        _.log({what: 'blop'}, 'whatever').should.be.an.Object
        _.log({what: 'blop'}).should.be.an.Object
        _.log('blob', 'whatever').should.be.an.String
        _.log(['blob'], 'whatever').should.be.an.Array
        _.log('blob').should.be.an.String
        done()

    #   it "should invert its args are a string then an object", (done)->
    #     _.log('whatever', {what: 'blop'}).should.be.an.Object
    #     _.log('whatever', ['blob']).should.be.an.Array
    #     done()

    # describe 'error', ->
    #   it "should return the first argument", (done)->
    #     _.error({what: 'blop'}, 'whatever').should.be.an.Object
    #     _.error({what: 'blop'}).should.be.an.Object
    #     _.error('blob', 'whatever').should.be.an.String
    #     _.error(['blob'], 'whatever').should.be.an.Array
    #     _.error('blob').should.be.an.String
    #     done()

    #   it "should invert its args are a string then an object", (done)->
    #     _.error('whatever', {what: 'blop'}).should.be.an.Object
    #     _.error('whatever', ['blob']).should.be.an.Array
    #     done()

    describe 'BindingLoggers', ->
      it "should return a function", (done)->
        _.Log('whatever').should.be.a.Function
        _.Error('whatever').should.be.a.Function
        _.Warn('whatever').should.be.a.Function
        _.Info('whatever').should.be.a.Function
        _.Success('whatever').should.be.a.Function
        logger = _.Log('whatever')
        logger.should.be.a.Function
        console.log logger
        logger('wat').should.be.a.String
        logger(['wat']).should.be.a.Array
        logger({hello: 'wat'}).should.be.an.Object
        done()