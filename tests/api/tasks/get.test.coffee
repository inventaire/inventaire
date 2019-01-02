CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createSomeTasks } = require '../fixtures/tasks'
{ createHuman, createWorkWithAuthor } = require '../fixtures/entities'
{ getByScore, getBySuspectUris, getBySuggestionUris, update, checkEntities } = require '../utils/tasks'

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

  it 'should return tasks in the right order', (done)->
    humanLabel = 'Stanislas Lem' # has no homonyms
    workLabel = 'Solaris' # too short label to be automerged
    createSomeTasks 'Gilbert Simondon'
    .then -> createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then -> getByScore()
      .then (tasks)->
        tasks.forEach (task, i)->
          previousTask = tasks[i-1]
          unless previousTask? then return
          prevOccurencesCount = previousTask.externalSourcesOccurrences.length
          occurrencesCount = task.externalSourcesOccurrences.length
          prevOccurencesCount.should.be.aboveOrEqual occurrencesCount
        done()
    .catch undesiredErr(done)

    return

describe 'tasks:bySuspectUris', ->
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
        done()
    .catch undesiredErr(done)

    return

  it 'should not return archived tasks', (done)->
    createSomeTasks 'Gilbert Simondon'
    .then (res)->
      task = res.tasks[0]
      { suspectUri } = task
      update task._id, 'state', 'dismissed'
      .then -> getBySuspectUris suspectUri
      .then (tasks)->
        tasks[suspectUri].length.should.equal 0
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

describe 'tasks:bySuggestionUris', ->
  it 'should return an array of tasks', (done)->
    uri = 'wd:Q1345582'
    createSomeTasks 'Gilbert Simondon'
    .then (res)->
      getBySuggestionUris uri
      .then (tasks)->
        tasks.should.be.an.Object()
        Object.keys(tasks).length.should.equal 1
        tasks[uri].should.be.an.Array()
        tasks[uri][0].should.be.an.Object()
        done()
    .catch undesiredErr(done)

    return

  it 'should return an array of tasks even when no tasks is found', (done)->
    uri = 'wd:Q32193244'
    getBySuggestionUris uri
    .then (tasks)->
      tasks.should.be.an.Object()
      Object.keys(tasks).length.should.equal 1
      tasks[uri].should.be.an.Array()
      tasks[uri].length.should.equal 0
      done()
    .catch undesiredErr(done)

    return
