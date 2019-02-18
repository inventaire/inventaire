CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ randomLabel, createPublisher } = require '../../fixtures/entities'
{ authReq, undesiredErr } = require '../../utils/utils'

describe 'entities:publishers:create', ->
  it 'should create a publisher entity', (done)->
    createPublisher()
    .then -> done()
    .catch undesiredErr(done)

    return

createPublisher = ->
  authReq 'post', '/api/entities?action=create',
    labels: { en: randomLabel() }
    claims:
      'wdt:P31': [ 'wd:Q2085381' ]
