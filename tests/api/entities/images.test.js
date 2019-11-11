CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, undesiredRes, undesiredErr } = require '../utils/utils'
{ rawRequest } = require '../utils/request'
host = CONFIG.fullHost()

describe 'entities:images', ->
  it 'should return an array of images associated with the passed uri', (done)->
    nonAuthReq 'get', '/api/entities?action=images&uris=wd:Q535'
    .then (res)->
      res.images.should.be.an.Object()
      res.images['wd:Q535'].should.be.an.Array()
      res.images['wd:Q535'][0].should.be.a.String()
      done()
    .catch undesiredErr(done)

    return

  it 'should reject redirect requests with multiple URIs', (done)->
    nonAuthReq 'get', '/api/entities?action=images&uris=wd:Q535|wd:Q42&redirect=true'
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      done()

    return

  it 'should redirect to the image if requested in options', (done)->
    url = "#{host}/api/entities?action=images&uris=wd:Q535&redirect=true&width=32"
    rawRequest 'get', { url }
    .then (res)->
      res.headers['content-type'].should.equal('image/jpeg')
      done()
    .catch undesiredErr(done)

    return
