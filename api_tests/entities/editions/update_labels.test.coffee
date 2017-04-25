CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, undesiredRes, undesiredErr } = __.require 'apiTests', 'utils/utils'

describe 'entities:editions:update-labels', ->
  it 'should reject labels update', (done)->
    editionPromise
    .then (edition)->
      authReq 'put', '/api/entities?action=update-label',
        id: edition._id
        lang: 'fr'
        value: 'bla'
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal "editions can't have labels"
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return

workPromise = authReq 'post', '/api/entities?action=create',
  labels: { fr: 'bla' }
  claims: { 'wdt:P31': [ 'wd:Q571' ] }

editionPromise = workPromise
  .then (work)->
    authReq 'post', '/api/entities?action=create',
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P629': [ work.uri ]
        'wdt:P1476': [ 'bla' ]
