import _ from '#builders/utils'
import tasks_ from './tasks.js'

// relationScore (between 0 & 1) express the number of tasks for the same suspect

export default suspectUri => {
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
