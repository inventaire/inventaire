import { cpus, loadavg } from 'node:os'
import { oneMinute } from '#lib/time'
import { assertNumber } from '#lib/utils/assert_types'
import { wait } from './promises.js'

const cpusCount = cpus().length
const checkIntervalBase = 10000
const maxCheckInterval = 5 * oneMinute

function getCPUsAverageLoad () {
  const [ lastMinuteAverageLoad ] = loadavg()
  return lastMinuteAverageLoad / cpusCount
}

export async function waitForCPUsLoadToBeBelow ({ threshold }) {
  assertNumber(threshold)
  const load = getCPUsAverageLoad()
  if (load > threshold) {
    // The more the load is far from the threshold,
    // the more we wait before retrying
    const factor = (load / threshold) ** 3
    const waitTime = Math.min(checkIntervalBase * factor, maxCheckInterval)
    await wait(waitTime)
    return waitForCPUsLoadToBeBelow({ threshold })
  }
}
