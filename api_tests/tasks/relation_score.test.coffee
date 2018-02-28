CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

byScore = '/api/tasks?action=by-score&limit=1000'
updateRelationScore = '/api/tasks?action=update-relation-score&id='

{ Promise } = __.require 'lib', 'promises'
{ authReq, nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createTask, createTaskWithSuggestionAuthor } = require '../fixtures/tasks'

describe 'tasks:update-relation-score', ->
  describe 'when a task have no homonym', ->
    it 'should have a relationScore equal to 1', (done)->
      createTaskWithSuggestionAuthor
        authorName: 'Stanilas Lem'
        suggestionUri: 'wd:Q6530'
      .then (res)->
        createdTask = _.first res.tasks
        authReq 'put', updateRelationScore + createdTask._id
      .then (task)->
        task.relationScore.should.equal 1
        done()
      .catch undesiredErr(done)

      return

  describe 'when 2 tasks have same suspect with different wd suggestions', ->
    it 'should relationScore should be depreciated', (done)->
      createTaskWithSuggestionAuthor
        authorName: 'Jim Vance'
        suggestionUri: 'wd:Q27042411'
      .then (res)->
        createdTask = _.first res.tasks
        createTask createdTask.suspectUri
        .then (res)->
          authReq 'put', updateRelationScore + createdTask._id
          .then (task)->
            task.relationScore.should.be.below 1
            done()
      .catch undesiredErr(done)

      return

