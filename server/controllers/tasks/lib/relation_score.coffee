__ = require('config').universalPath
_ = __.require 'builders', 'utils'

tasks_ = require './tasks'

# relation score express the number of suggestions for the same suspect
# calculated based on the number of homonyms found on wikidata
calculateRelationScore = (tasks)->
  score = 1 / tasks.length
  _.round(score, 2)

module.exports =
  calculateRelationScore: calculateRelationScore
  updateRelationScore: (task)->
    tasks_.bySuspectUri(task.suspectUri)
    .then (tasks)-> calculateRelationScore(tasks)
    .then (score)->
      tasks_.update
        taskId: task._id
        attribute: 'relationScore'
        newValue: score
