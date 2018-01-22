CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, undesiredRes, undesiredErr } = require '../utils/utils'
{ createWork, createEdition } = require '../fixtures/entities'

describe 'entities:update-claims', ->
  it 'should reject an update with an inappropriate property', (done)->
    createWork()
    .then (work)->
      authReq 'put', '/api/entities?action=update-claim',
        id: work._id
        # A work entity should not have pages count
        property: 'wdt:P1104'
        'new-value': 124
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal "works can't have a property wdt:P1104"
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an update removing a critical claim', (done)->
    createEdition()
    .then (edition)->
      authReq 'put', '/api/entities?action=update-claim',
        id: edition._id
        # An edition entity should always have at least one wdt:P629 claim
        property: 'wdt:P629'
        'old-value': edition.claims['wdt:P629'][0]
        'new-value': null
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal "this property should at least have one value"
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return
