CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ createPublisher } = require '../../fixtures/entities'
{ authReq, undesiredErr } = require '../../utils/utils'

describe 'entities:publishers:create', ->
  it 'should create a publisher entity', (done)->
    createPublisher()
    .then -> done()
    .catch undesiredErr(done)

    return
