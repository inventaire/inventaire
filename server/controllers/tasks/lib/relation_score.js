// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const tasks_ = require('./tasks')
// relationScore (between 0 & 1) express the number of tasks for the same suspect

module.exports = suspectUri => tasks_.bySuspectUri(suspectUri)
.then((tasks) => {
  const relationScore = calculateRelationScore(tasks)
  const tasksToUpdate = tasks.filter(relationScoreIsntUpToDate(relationScore))
  if (tasksToUpdate.length === 0) { return }
  return tasks_.update({
    ids: _.map(tasksToUpdate, '_id'),
    attribute: 'relationScore',
    newValue: relationScore
  })
})

var calculateRelationScore = function(list){
  const score = 1 / list.length
  return _.round(score, 2)
}

var relationScoreIsntUpToDate = relationScore => task => task.relationScore !== relationScore
