const CONFIG = require('config')
const _ = require('builders/utils')
const dbBaseUrl = CONFIG.db.fullHost()
const requests_ = require('lib/requests')
const { wait } = require('lib/promises')

let count = 0
const waitForActiveTasksToBeDone = async () => {
  const activeTasks = await requests_.get(`${dbBaseUrl}/_active_tasks`)
  if (activeTasks.length > 0) {
    _.info(formatTasks(activeTasks), `waiting for active tasks (${++count})`)
    await wait(2000)
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

module.exports = {
  waitForActiveTasksToBeDone,
}
