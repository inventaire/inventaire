CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createSomeTasks } = require '../fixtures/tasks'
{ getBySuspectUri, getByScore } = require '../utils/tasks'

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
    .then (res)-> getBySuspectUri res.humans[0].uri
    .then (tasks)->
      suspectUris = _.pluck tasks, 'suspectUri'
      suspectUris.should.be.an.Array()
      _.uniq(suspectUris).length.should.equal 1
      done()
    .catch undesiredErr(done)

    return
