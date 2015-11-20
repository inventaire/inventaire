CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
sinon = require 'sinon'
promises_ = __.require 'lib', 'promises'

pathname = "/api/entities/public"
root = CONFIG.fullHost()
path = root + pathname

errorCount = -> promises_.get root + "/error/count"

assertZeroError = (done, label)->
  errorCount()
  .then (res)->
    _.info(String(res.count), "error count @#{label}").should.equal('0')
    done()

describe 'env', ->
  it "should start with 0 error", (done)->
    assertZeroError(done, 'env')

describe 'Entities', ->
  describe 'action', ->
    describe 'search', ->

      describe 'byIsbn', ->
        it "should have no error", (done)->
          url = path + "?action=search&search=978-2081-2178-29&language=en"
          promises_.get url
          .then (res)->
            res.should.be.an.Object
            res.items.should.be.an.Array
            assertZeroError(done, 'byIsbn')

      describe 'byText', ->
        it "should have no error", (done)->
          url = path + "?action=search&search=harry potter&language=en"
          promises_.get url
          .then (res)->
            res.should.be.an.Object
            res.items.should.be.an.Array
            assertZeroError(done, 'byText')

    describe 'getimages', ->
      it "should have no error", (done)->
        data = "Les Misérables"
        url = path + "?action=getimages&data=#{data}"
        promises_.get url
        .then (res)->
          res.should.be.an.Array
          res[0].should.be.an.Object
          res[0].image.should.be.an.String
          res[0].data.should.equal data
          assertZeroError(done, 'getimages')

    describe 'getisbnentities', ->
      it "should have no error", (done)->
        data = "Les Misérables"
        isbns = "978-2081-2178-29|9782070368228"
        url = path + "?action=getisbnentities&isbns=#{isbns}"
        promises_.get url
        .then (res)->
          res.should.be.an.Object
          assertZeroError(done, 'getisbnentities')
