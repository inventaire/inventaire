CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createSomeTasks } = require '../fixtures/tasks'
{ getBySuspectUris, getByScore } = require '../utils/tasks'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:byScore', ->
  it 'should returns 10 or less tasks to deduplicates, by default', (done)->
    createSomeTasks 'Gilbert Simondon'
    .then getByScore
    .then (tasks)->
      tasks.length.should.be.belowOrEqual 10
      tasks.length.should.be.aboveOrEqual 1
      done()
    .catch undesiredErr(done)

    return

  it 'should returns a limited array of tasks to deduplicate', (done)->
    createSomeTasks 'Gilbert Simondon'
    .then -> getByScore { limit: 1 }
    .then (tasks)->
      tasks.length.should.equal 1
      done()
    .catch undesiredErr(done)

    return

  it 'should take an offset parameter', (done)->
    createSomeTasks 'Gilbert Simondon'
    .then getByScore
    .then (tasksA)->
      getByScore { offset: 1 }
      .then (tasksB)->
        tasksA[1].should.deepEqual tasksB[0]
        done()
    .catch undesiredErr(done)

    return

describe 'tasks:bySuspectUri', ->
  it 'should return an array of tasks', (done)->
    createSomeTasks 'Gilbert Simondon'
    .then (res)->
      { uri } = res.humans[0]
      getBySuspectUris uri
      .then (tasks)->
        tasks.should.be.an.Object()
        Object.keys(tasks).length.should.equal 1
        tasks[uri].should.be.an.Array()
        tasks[uri][0].should.be.an.Object()
        suspectUris = _.pluck tasks[uri][0], 'suspectUri'
        done()
    .catch undesiredErr(done)

    return

  it 'should return an array of tasks even when no tasks is found', (done)->
    fakeUri = 'inv:00000000000000000000000000000000'
    getBySuspectUris fakeUri
    .then (tasks)->
      tasks.should.be.an.Object()
      Object.keys(tasks).length.should.equal 1
      tasks[fakeUri].should.be.an.Array()
      tasks[fakeUri].length.should.equal 0
      done()
    .catch undesiredErr(done)

    return
