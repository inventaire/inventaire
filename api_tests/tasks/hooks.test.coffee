CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, adminReq } = require '../utils/utils'
{ merge } = require '../utils/entities'
{ collectEntities } = require '../fixtures/tasks'
{ createHuman } = require '../fixtures/entities'
{ deleteByUris: deleteEntityByUris } = require '../utils/entities'
{ getByIds, getBySuspectUri, getByScore, update } = require '../utils/tasks'

describe 'tasks:hooks', ->
  describe 'entity merge', ->
    it 'should update same suspect tasks to merged state', (done) ->
      # Alexander Kennedy is expected to have several merge suggestions
      createHuman { labels: { en: 'Alexander Kennedy' } }
      .then (human)->
        collectEntities { refresh: true }
        .delay 3000
        .then -> getBySuspectUri human.uri
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
      collectEntities()
      .then getByScore
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
      .then (suspect)->
        collectEntities { refresh: true }
        # A long delay is required because the collection is done by
        # a worker, which might not be done yet without it
        .delay 5000
        .then -> getBySuspectUri suspect.uri
        .then (tasks)->
          taskToUpdate = tasks[0]
          otherTask = tasks[1]
          taskRelationScore = taskToUpdate.relationScore
          update taskToUpdate._id, 'state', 'dismissed'
          .delay 1000
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
        collectEntities { refresh: true }
        .delay 5000
        .then -> getBySuspectUri human.uri
        .then (tasks)->
          tasks.length.should.be.aboveOrEqual 1
          deleteEntityByUris human.uri
        .then -> getBySuspectUri human.uri
      .then (tasks)->
        tasks.length.should.equal 0
        done()
      .catch done

      return
