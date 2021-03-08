const __ = require('config').universalPath
const _ = require('builders/utils')
const tasks_ = require('./tasks')
// relationScore (between 0 & 1) express the number of tasks for the same suspect

module.exports = suspectUri => {
  return tasks_.bySuspectUri(suspectUri)
  .then(tasks => {
    const relationScore = calculateRelationScore(tasks)
    const tasksToUpdate = tasks.filter(relationScoreIsntUpToDate(relationScore))
    if (tasksToUpdate.length === 0) return
    return tasks_.update({
      ids: _.map(tasksToUpdate, '_id'),
      attribute: 'relationScore',
      newValue: relationScore
    })
  })
}

const calculateRelationScore = list => {
  const score = 1 / list.length
  return _.round(score, 6)
}

const relationScoreIsntUpToDate = relationScore => task => task.relationScore !== relationScore
