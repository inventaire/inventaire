import { map, round } from 'lodash-es'
import { getTasksBySuspectUri, updateTask } from '#controllers/tasks/lib/tasks'
import type { EntityUri } from '#types/entity'

// relationScore (between 0 & 1) express the number of tasks for the same suspect

export default async function getRelationScore (suspectUri: EntityUri) {
  const tasks = await getTasksBySuspectUri(suspectUri)
  const relationScore = calculateRelationScore(tasks)
  const tasksToUpdate = tasks.filter(relationScoreIsntUpToDate(relationScore))
  if (tasksToUpdate.length === 0) return
  return updateTask({
    ids: map(tasksToUpdate, '_id'),
    attribute: 'relationScore',
    newValue: relationScore,
  })
}

function calculateRelationScore (list) {
  const score = 1 / list.length
  return round(score, 6)
}

const relationScoreIsntUpToDate = relationScore => task => task.relationScore !== relationScore
