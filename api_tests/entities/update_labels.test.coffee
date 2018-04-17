CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredRes, undesiredErr } = require '../utils/utils'
{ createHuman } = require '../fixtures/entities'
{ updateLabel } = require '../utils/entities'

humanPromise = createHuman()

describe 'entities:update-labels', ->
  it 'should reject an update with an invalid lang', (done)->
    humanPromise
    .then (human)-> updateLabel human._id, 'zz', 'foo'
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose.should.startWith 'invalid lang'
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an update with an invalid value', (done)->
    humanPromise
    .then (human)-> updateLabel human._id, 'en', 123
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose.should.startWith 'invalid value'
        done()
    .catch undesiredErr(done)

    return

  it 'should reject an up-to-date value', (done)->
    humanPromise
    .then (human)->
      updateLabel human._id, 'en', 'foo'
      .catch undesiredErr(done)
      .then -> updateLabel human._id, 'en', 'foo'
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose.should.startWith 'already up-to-date'
        done()
    .catch undesiredErr(done)

    return
