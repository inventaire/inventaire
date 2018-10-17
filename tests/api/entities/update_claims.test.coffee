CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ undesiredRes, undesiredErr } = require '../utils/utils'
{ createWork, createEdition } = require '../fixtures/entities'
{ updateClaim, merge } = require '../utils/entities'

describe 'entities:update-claims', ->
  it 'should reject an update with an inappropriate property', (done)->
    createWork()
    .then (work)->
      # A work entity should not have pages count
      updateClaim work._id, 'wdt:P1104', null, 124
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal "works can't have a property wdt:P1104"
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an update with an inappropriate property datatype', (done)->
    createWork()
    .then (work)->
      updateClaim work._id, 'wdt:P50', null, 124
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal 'invalid value type: expected string, got number'
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an update removing a critical claim', (done)->
    createEdition()
    .then (edition)->
      oldValue = edition.claims['wdt:P629'][0]
      # An edition entity should always have at least one wdt:P629 claim
      updateClaim edition._id, 'wdt:P629', oldValue, null
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal 'this property should at least have one value'
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an update on an obsolete entity', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      merge workA._id, workB._id
      .then -> updateClaim workA._id, 'wdt:P50', null, 'wd:Q535'
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'this entity is obsolete'
      done()
    .catch undesiredErr(done)

    return
