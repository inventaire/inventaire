CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

deduplicates = '/api/tasks?action=deduplicates'
deduplicateEntities = '/api/tasks?action=deduplicate-entities'
{ authReq, nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

describe 'tasks:create', ->
  it 'should create new tasks', (done)->
    authReq 'post', '/api/tasks?action=create',
      type: 'deduplicate'
      suspectUri: 'inv:089b1950b230556f6c2b22557104eb86'
    .then (res)->
      res.type.should.equal 'deduplicate'
      res.state.should.equal 'requested'
      res.suspectUri.should.equal 'inv:089b1950b230556f6c2b22557104eb86'
      res._id.should.be.a.String()
      res._rev.should.be.a.String()
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task without a valid suspect URI', (done)->
    authReq 'post', '/api/tasks?action=create',
      type: 'deduplicate'
      suspectUri: 'inv:alidID1234'
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid suspect'
      done()
    .catch undesiredErr(done)

    return

describe 'tasks:deduplicate-entities', ->
  it 'should get new tasks created', (done)->
    createHuman('Stanislas Lem')
    .then (human) -> nonAuthReq 'get', deduplicateEntities
    .then (res)-> nonAuthReq 'get', deduplicates + "&limit=1"
    .then (res)->
      res.length.should.equal(1)
      done()
    .catch undesiredErr(done)

    return
