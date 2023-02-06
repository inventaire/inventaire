import { cpus, loadavg } from 'node:os'
import { wait } from './promises.js'
import { assert_ } from './utils/assert_types.js'

const cpusCount = cpus().length
const checkIntervalBase = 10000

const getCPUsAverageLoad = () => {
  const [ last5MinutesAverageLoad ] = loadavg()
  return last5MinutesAverageLoad / cpusCount
}

export async function waitForCPUsLoadToBeBelow ({ threshold }) {
  assert_.number(threshold)
  const load = getCPUsAverageLoad()
  if (load > threshold) {
    // The more the load is far from the threshold,
    // the more we wait before retrying
    const factor = (load / threshold) ** 3
    await wait(checkIntervalBase * factor)
    return waitForCPUsLoadToBeBelow({ threshold, checkIntervalBase })
  }
}
