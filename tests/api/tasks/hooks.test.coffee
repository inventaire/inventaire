CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ merge } = require '../utils/entities'
{ createHuman } = require '../fixtures/entities'
{ deleteByUris: deleteEntityByUris } = require '../utils/entities'
{ getByIds, getBySuspectUri, update, checkEntities } = require '../utils/tasks'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:hooks', ->
  describe 'entity merge', ->
    it 'should update same suspect tasks to merged state', (done) ->
      # Alexander Kennedy is expected to have several merge suggestions
      createHuman { labels: { en: 'Alexander Kennedy' } }
      .then (human)-> checkEntities human.uri
      .then (tasks)->
        task = tasks[0]
        anotherTask = tasks[1]
        merge task.suspectUri, task.suggestionUri
        .delay 100
        .then -> getByIds anotherTask._id
        .then (tasks)->
          updatedTask = tasks[0]
          updatedTask.state.should.equal 'merged'
          done()
      .catch done

      return

    it 'should update task state to merged', (done) ->
      createHuman { labels: { en: 'Fred Vargas' } }
      .then (human)-> checkEntities human.uri
      .then (tasks)->
        task = tasks[0]
        merge task.suspectUri, task.suggestionUri
        .delay 100
        .then -> getByIds task._id
        .then (tasks)->
          updatedTask = tasks[0]
          updatedTask.state.should.equal 'merged'
          done()
      .catch done

      return

    it 'should update relationScore of tasks with same suspect', (done)->
      # John Smith is expected to have several merge suggestions
      createHuman { labels: { en: 'John Smith' } }
      .then (human)-> checkEntities human.uri
      .then (tasks)->
        taskToUpdate = tasks[0]
        otherTask = tasks[1]
        { relationScore: taskRelationScore } = taskToUpdate
        update taskToUpdate._id, 'state', 'dismissed'
        .delay 100
        .then -> getByIds otherTask._id
        .then (tasks)->
          updatedTask = tasks[0]
          updatedTask.relationScore.should.not.equal taskRelationScore
          done()
      .catch done

      return

  describe 'entity removed', ->
    it 'should update tasks to merged state', (done) ->
      createHuman { labels: { en: 'Fred Vargas' } }
      .then (human)->
        checkEntities human.uri
        .then (tasks)->
          tasks.length.should.be.aboveOrEqual 1
          return deleteEntityByUris human.uri
        .then -> getBySuspectUri human.uri
      .then (tasks)->
        tasks.length.should.equal 0
        done()
      .catch done

      return
