const { cpus, loadavg } = require('os')
const { wait } = require('./promises')
const assert_ = require('./utils/assert_types')
const cpusCount = cpus().length
const checkIntervalBase = 10000

const getCPUsAverageLoad = () => {
  const [ last5MinutesAverageLoad ] = loadavg()
  return last5MinutesAverageLoad / cpusCount
}

const waitForCPUsLoadToBeBelow = async ({ threshold }) => {
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

module.exports = {
  waitForCPUsLoadToBeBelow,
}
