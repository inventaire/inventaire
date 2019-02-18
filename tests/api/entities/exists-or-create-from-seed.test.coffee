CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, undesiredErr } = require '../utils/utils'
{ getSomeIsbn, humanName, randomLabel } = require '../fixtures/entities'

describe 'entities:exists-or-create-from-seed', ->
  it 'should reject if params isbn is missing', (done)->
    authReq 'post', '/api/entities?action=exists-or-create-from-seed'
    .catch (err)->
      err.body.status_verbose.should.startWith 'missing parameter'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject if params title is missing', (done)->
    authReq 'post', '/api/entities?action=exists-or-create-from-seed',
      isbn: getSomeIsbn()
    .catch (err)->
      err.body.status_verbose.should.startWith 'missing parameter'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject if authors is not a string', (done)->
    authReq 'post', '/api/entities?action=exists-or-create-from-seed',
      isbn: getSomeIsbn()
      title: randomLabel()
      authors: 1
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid authors'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject if isbn is invalid', (done)->
    authReq 'post', '/api/entities?action=exists-or-create-from-seed',
      isbn: '000000'
      title: randomLabel()
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid isbn'
      done()
    .catch undesiredErr(done)

    return

  it 'should accept if params authors is missing', (done)->
    authReq 'post', '/api/entities?action=exists-or-create-from-seed',
      isbn: getSomeIsbn()
      title: randomLabel()
    .then (res)->
      res._id.should.be.a.String()
      done()
    .catch undesiredErr(done)

    return

  it 'should create an edition and a work from seed', (done)->
    authReq 'post', '/api/entities?action=exists-or-create-from-seed',
      isbn: getSomeIsbn()
      title: randomLabel()
      authors: [ randomLabel() ]
    .then (res)->
      res._id.should.be.a.String()
      workUri = res.claims['wdt:P629'][0]
      authReq 'get', "/api/entities?action=by-uris&uris=#{workUri}"
      .get 'entities'
      .then (entities)->
        entities[workUri].should.be.an.Object()
        done()
    .catch undesiredErr(done)

    return
