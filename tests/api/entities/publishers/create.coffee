CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ randomLabel, createEdition, createPublisher } = require '../../fixtures/entities'
{ updateClaim } = require '../../utils/entities'
{ authReq, undesiredErr } = require '../../utils/utils'

describe 'entities:publishers:create', ->
  it 'should create an inventaire publisher entity', (done)->
    createPublisher()
    .then (publisherDoc) ->
      publisherDoc.type.should.equal 'publisher'
      done()
    .catch undesiredErr(done)

    return

  it 'should update an edition claim with an inventaire publisher entity', (done)->
    createEdition()
    .then (edition)->
      editionUri = "inv:#{edition._id}"
      createPublisher()
      .then (publisher)->
        oldVal = null
        newVal = "inv:#{publisher._id}"
        property = 'wdt:P123'
        updateClaim(editionUri, property, oldVal, newVal)
        .then (res)-> done()
    .catch undesiredErr(done)

    return
