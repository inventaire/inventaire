import CONFIG from 'config'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import { info } from '#lib/utils/logs'

const dbBaseUrl = CONFIG.db.getOrigin()

let count = 0
export const waitForActiveTasksToBeDone = async () => {
  const activeTasks = await requests_.get(`${dbBaseUrl}/_active_tasks`)
  if (activeTasks.length > 0) {
    info(formatTasks(activeTasks), `waiting for active tasks (${++count})`)
    await wait(5000)
    return waitForActiveTasksToBeDone()
  }
}
const formatTasks = tasks => tasks.map(formatTask).join('\n')

const formatTask = task => {
  const { type, process_status: processStatus, database, design_document: designDocument, changes_done: changesDone, total_changes: totalChanges } = task
  let { started_on: startedOn, updated_on: updatedOn } = task
  startedOn = toTime(startedOn)
  updatedOn = toTime(updatedOn)
  return `${database} ${designDocument} ${type} ${changesDone}/${totalChanges} (${processStatus}, start: ${startedOn}, updated: ${updatedOn})`
}

const toTime = secondEpoch => new Date(secondEpoch * 1000).toISOString().split(/[T.]/)[1]
