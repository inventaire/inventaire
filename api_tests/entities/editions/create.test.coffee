CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, undesiredErr, undesiredRes } = require '../../utils/utils'

describe 'entities:editions:create', ->
  it 'should not be able to create an edition entity without a work entity', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: {}
      claims: { 'wdt:P31': [ 'wd:Q3331189' ] }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'an edition should have an associated work (wdt:P629)'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject an edition entity without a title', (done)->
    workEntityPromise
    .then (workEntity)->
      authReq 'post', '/api/entities?action=create',
        labels: {}
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P629': [ workEntity.uri ]
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'an edition should have a title (wdt:P1476)'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject an edition with a label', (done)->
    workEntityPromise
    .then (workEntity)->
      authReq 'post', '/api/entities?action=create',
        labels: { fr: 'bla' }
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P629': [ workEntity.uri ]
          'wdt:P1476': [ 'bla' ]
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal "editions can't have labels"
      done()
    .catch undesiredErr(done)

    return

  it 'should accept an edition without a labels object', (done)->
    workEntityPromise
    .then (workEntity)->
      authReq 'post', '/api/entities?action=create',
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P629': [ workEntity.uri ]
          'wdt:P1476': [ 'bla' ]
    .then -> done()
    .catch undesiredErr(done)

    return

  it 'should not be able to create an edition entity with a non-work entity', (done)->
    serieEntityPromise
    .then (serieEntity)->
      authReq 'post', '/api/entities?action=create',
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P629': [ serieEntity.uri ]
          'wdt:P1476': [ 'bla' ]
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'invalid claim entity type: serie'
      done()
    .catch undesiredErr(done)

    return

workEntityPromise = authReq 'post', '/api/entities?action=create',
  labels: { fr: 'bla' }
  claims: { 'wdt:P31': [ 'wd:Q571' ] }

serieEntityPromise = authReq 'post', '/api/entities?action=create',
  labels: { fr: 'bla' }
  claims: { 'wdt:P31': [ 'wd:Q277759' ] }
