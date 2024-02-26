import { cpus, loadavg } from 'node:os'
import { oneMinute } from '#lib/time'
import { wait } from './promises.js'
import { assert_ } from './utils/assert_types.js'

const cpusCount = cpus().length
const checkIntervalBase = 10000
const maxCheckInterval = 5 * oneMinute

const getCPUsAverageLoad = () => {
  const [ lastMinuteAverageLoad ] = loadavg()
  return lastMinuteAverageLoad / cpusCount
}

export async function waitForCPUsLoadToBeBelow ({ threshold }) {
  assert_.number(threshold)
  const load = getCPUsAverageLoad()
  if (load > threshold) {
    // The more the load is far from the threshold,
    // the more we wait before retrying
    const factor = (load / threshold) ** 3
    const waitTime = Math.min(checkIntervalBase * factor, maxCheckInterval)
    await wait(waitTime)
    return waitForCPUsLoadToBeBelow({ threshold, checkIntervalBase })
  }
}
