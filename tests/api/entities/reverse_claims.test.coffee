CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredErr, undesiredRes } = require '../utils/utils'

buildUrl = (property, value)->
  url = _.buildPath '/api/entities', { action: 'reverse-claims', property, value }

describe 'entities:reverse-claims', ->
  it 'should reject wdt:P31 requests', (done)->
    nonAuthReq 'get', buildUrl('wdt:P31', 'wd:Q571')
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'blacklisted property'
      done()
    .catch undesiredErr(done)

    return

  it 'should accept whitelisted entity value properties', (done)->
    nonAuthReq 'get', buildUrl('wdt:P921', 'wd:Q456')
    .then (res)->
      res.uris.should.be.an.Array()
      done()
    .catch undesiredErr(done)

    return

  it 'should accept whitelisted string value properties', (done)->
    nonAuthReq 'get', buildUrl('wdt:P3035', '978-2-505')
    .then (res)->
      res.uris.should.be.an.Array()
      done()
    .catch undesiredErr(done)

    return
