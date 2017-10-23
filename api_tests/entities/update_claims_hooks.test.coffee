CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
promises_ = __.require 'lib', 'promises'
{ nonAuthReq, authReq, undesiredRes, undesiredErr } = require '../utils/utils'

describe 'entities:update-claims-hooks', ->
  it 'should update a work label from an edition title update if in sync', (done)->
    createWork()
    .then (work)->
      createEdition work
      .then (edition)->
        authReq 'put', '/api/entities?action=update-claim',
          id: edition._id
          property: 'wdt:P1476'
          'old-value': 'bla'
          'new-value': 'bla-updated'
      .delay 100
      .then ->
        nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{work.uri}"
        .then (res)->
          work = res.entities[work.uri]
          work.labels.fr.should.equal 'bla-updated'
          done()

    .catch undesiredErr(done)

    return

  it 'should not update a work label if editions disagree on the title', (done)->
    createWork()
    .then (work)->
      promises_.all [
        createEdition work
        createEdition work
      ]
      .spread (editionA, editionB)->
        authReq 'put', '/api/entities?action=update-claim',
          id: editionA._id
          property: 'wdt:P1476'
          'old-value': 'bla'
          'new-value': 'bla-updated'
      .delay 100
      .then ->
        nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{work.uri}"
        .then (res)->
          work = res.entities[work.uri]
          work.labels.fr.should.equal 'bla'
          done()

    .catch undesiredErr(done)

    return

createWork = ->
  authReq 'post', '/api/entities?action=create',
    labels: { fr: 'bla' }
    claims: { 'wdt:P31': [ 'wd:Q571' ] }

createEdition = (work)->
  authReq 'post', '/api/entities?action=create',
    claims:
      'wdt:P31': [ 'wd:Q3331189' ]
      'wdt:P1476': [ 'bla' ]
      'wdt:P629': [ work.uri ]
      # Lang = fr
      'wdt:P407': [ 'wd:Q150' ]
