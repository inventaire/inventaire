CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
randomString = __.require 'lib', './utils/random_string'

createTaskPath = '/api/tasks?action=create'
{ authReq, nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

describe 'tasks:create', ->
  it 'should create new tasks', (done)->
    createHuman(randomString(10))
    .then (suspect)->
      suspectId = suspect._id
      authReq 'post', createTaskPath,
        type: 'deduplicate'
        suspectUri: "inv:#{suspectId}"
        suggestionUri: randomString(10)
      .then (res)->
        res.type.should.equal 'deduplicate'
        res.state.should.equal 'requested'
        res.suspectUri.should.equal "inv:#{suspectId}"
        res._id.should.be.a.String()
        done()
      .catch undesiredErr(done)

    return

  it 'should not create a task with invalid type', (done)->
    authReq 'post', createTaskPath,
      type: 'invalidTypeee'
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid type'
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task with invalid type', (done)->
    authReq 'post', createTaskPath,
      type: 'deduplicate'
      state: 'invalid'
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid state'
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task without a valid suspect URI', (done)->
    authReq 'post', createTaskPath,
      type: 'deduplicate'
      suspectUri: 'inv:alidID1234'
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid suspect'
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task if another task already have same suspect AND suggestion uris', (done)->
    createHuman(randomString(10))
    .then (suspect)->
      suspectId = suspect._id
      newTaskDoc =
        type: 'deduplicate'
        suspectUri: "inv:#{suspectId}"
        suggestionUri: randomString(10)
      authReq 'post', createTaskPath, newTaskDoc
      .then ->
        authReq 'post', createTaskPath, newTaskDoc
        .catch (err)->
          err.body.status_verbose.should.startWith 'task already created'
          done()
      .catch undesiredErr(done)

    return

  it 'should create a task if another task have same suspect but different suggestion uris', (done)->
    createHuman(randomString(10))
    .then (suspect)->
      suspectId = suspect._id
      authReq 'post', createTaskPath,
        type: 'deduplicate'
        suspectUri: "inv:#{suspectId}"
        suggestionUri: randomString(10)
      .then ->
        authReq 'post', createTaskPath,
          type: 'deduplicate'
          suspectUri: "inv:#{suspectId}"
          suggestionUri: randomString(10)
        .then (res)->
          res._id.should.be.a.String()
          done()
      .catch undesiredErr(done)

    return
