CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
randomString = __.require 'lib', './utils/random_string'

collectEntities = '/api/tasks?action=collect-entities'
byScore = '/api/tasks?action=by-score&limit=1000'

{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

describe 'tasks:collect-entities', ->
  it 'should create new tasks', (done)->
    createHuman { labels: { en: 'Stanislas Lem' } }
    .then (suspect)->
      suspectId = suspect._id

      authReq 'post', collectEntities
      .then -> authReq 'get', byScore
      .then (res)->
        { tasks } = res
        tasks.length.should.aboveOrEqual 1
        # with a suspect
        tasksUris = _.pluck tasks, 'suspectUri'
        tasksUris.should.containEql "inv:#{suspectId}"
        # with a relationScore
        taskRelationScores = _.pluck tasks, 'relationScore'
        _.compact(taskRelationScores).length.should.equal taskRelationScores.length
        done()
      .catch undesiredErr(done)

    return

  it 'should not re-create existing tasks', (done)->
    authReq 'post', collectEntities
    .then -> authReq 'get', byScore
    .then (res)->
      { tasks } = res
      uniqSuspectUris = _.uniq _.pluck(tasks, 'suspectUri')
      tasks.length.should.equal uniqSuspectUris.length
      done()
    .catch undesiredErr(done)

    return
