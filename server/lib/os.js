const { cpus, loadavg } = require('os')
const { wait } = require('./promises')
const assert_ = require('./utils/assert_types')
const cpusCount = cpus().length

const getCPUsAverageLoad = () => {
  const [ last5MinutesAverageLoad ] = loadavg()
  return last5MinutesAverageLoad / cpusCount
}

const waitForCPUsLoadToBeBelow = async ({ threshold, checkInterval = 10000 }) => {
  assert_.number(threshold)
  assert_.number(checkInterval)
  if (getCPUsAverageLoad() > threshold) {
    await wait(checkInterval)
    return waitForCPUsLoadToBeBelow()
  }
}

module.exports = {
  waitForCPUsLoadToBeBelow,
}
