CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredRes, undesiredErr } = require '../utils/utils'
{ createHuman } = require '../fixtures/entities'
{ updateLabel } = require '../utils/entities'

humanPromise = createHuman()

describe 'entities:update-labels', ->
  it 'should reject an update with an inappropriate lang', (done)->
    humanPromise
    .then (human)-> updateLabel human._id, 'zz', 'foo'
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose.should.startWith 'invalid lang'
        done()
    .catch undesiredErr(done)

    return
