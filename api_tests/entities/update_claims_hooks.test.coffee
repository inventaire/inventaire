CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
promises_ = __.require 'lib', 'promises'
{ nonAuthReq, authReq, undesiredRes, undesiredErr } = require '../utils/utils'
{ createWork, createEditionFromWorks } = require '../fixtures/entities'

describe 'entities:update-claims-hooks', ->
  it 'should update a work label from an edition title update if in sync', (done)->
    createWork()
    .then (work)->
      createEditionFromWorks work
      .then (edition)->
        value = edition.claims['wdt:P1476'][0]
        updatedValue = value + 'updated'
        authReq 'put', '/api/entities?action=update-claim',
          id: edition._id
          property: 'wdt:P1476'
          'old-value': value
          'new-value': updatedValue
        .delay 100
        .then ->
          nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{work.uri}"
          .then (res)->
            refreshedWork = res.entities[work.uri]
            refreshedWork.labels.en.should.equal updatedValue
            done()

    .catch undesiredErr(done)

    return

  it 'should not update a work label if editions disagree on the title', (done)->
    createWork()
    .then (work)->
      promises_.all [
        createEditionFromWorks work
        createEditionFromWorks work
      ]
      .spread (editionA, editionB)->
        valueA = editionA.claims['wdt:P1476'][0]
        updatedValueA = valueA + 'updated'
        authReq 'put', '/api/entities?action=update-claim',
          id: editionA._id
          property: 'wdt:P1476'
          'old-value': valueA
          'new-value': updatedValueA
        .delay 100
        .then ->
          nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{work.uri}"
          .then (res)->
            refreshedWork = res.entities[work.uri]
            refreshedWork.labels.en.should.equal work.labels.en
            done()

    .catch undesiredErr(done)

    return
