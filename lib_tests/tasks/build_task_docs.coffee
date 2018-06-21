CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

buildTaskDocs = __.require 'controllers', 'tasks/lib/build_task_docs'

input = suspectEntity = {
  _id: '026a1856df319a2fe3c14c4db6011feb'
  _rev: '2-6007692334a5101cd3349b3b26f8df03'
  type: 'entity'
  labels: { en: 'Victor Hugo' }
  claims: { 'wdt:P31': [ 'wd:Q5' ] }
}

validTask = {
  type: 'deduplicate'
  suspectUri: "inv:#{suspectEntity._id}"
  suggestionUri: 'wd:Q535'
  lexicalScore: 16
  relationScore: 1
  hasEncyclopediaOccurence: true
}

describe 'create tasks doc based on inv entity object', ->
  it 'should return an array of tasks with the same suspectUri', (done)->
    buildTaskDocs suspectEntity
    .then (taskDocs)->
      tasksSuspectUris = _.pluck taskDocs, 'suspectUri'
      _.uniq(tasksSuspectUris).length.should.equal 1

      firstSupectUri = taskDocs[0].suspectUri
      firstSupectUri.should.equal "inv:#{suspectEntity._id}"

      done()

    return

  it 'should return a relationScore for every tasks', (done)->
    buildTaskDocs suspectEntity
    .then (taskDocs)->
      taskRelationScores = _.pluck taskDocs, 'relationScore'
      _.compact(taskRelationScores).length.should.equal taskRelationScores.length

      done()

    return

  it 'should return if task has encyclopedia occurence for every tasks', (done)->
    buildTaskDocs suspectEntity
    .then (taskDocs)->
      taskEncyclopedia = _.pluck taskDocs, 'hasEncyclopediaOccurence'
      _.without(taskEncyclopedia, true, false).should.deepEqual []

      done()

    return
