CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq } = __.require 'apiTests', 'utils/utils'

describe 'entities:editions:create', ->
  it 'should not be able to create an edition entity without a work entity or an ISBN', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: {}
      claims: { 'wdt:P31': [ 'wd:Q3331189' ] }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'an edition entity should have an associated work claim (wdt:P629) or an ISBN-13 (wdt:P212)'
      done()

    return

  # Not testing with an ISBN but without a work entity, as you would need
  # to find different but valid ISBN for every tests for the creation to be accepted
