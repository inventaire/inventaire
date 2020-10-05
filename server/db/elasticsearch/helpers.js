const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

module.exports = {
  activeI18nLangs: 'ar bn ca cs da de el en eo es fr hu id it ja nb nl pa pl pt ro ru sk sv tr uk'.split(' '),

  logBulkRes: (res, label) => {
    const { items } = res
    const globalStatus = {}

    items.forEach(item => {
      for (const operation in item) {
        const opRes = item[operation]
        if (globalStatus[operation] == null) {
          globalStatus[operation] = { success: 0, error: 0 }
        }
        if (opRes.status >= 400) {
          if (opRes.status === 404) {
            if (operation === 'delete') {
              // Known case: happens when an deindexation is requested before the indexation was done
              _.warn(opRes._id, "can't deindex: doc not found")
            } else {
              _.warn(opRes._id, `${label} not found`)
            }
          } else {
            _.warn(item, `${label} failed`)
          }
          globalStatus[operation].error++
        } else {
          globalStatus[operation].success++
        }
      }
    })

    const color = getLoggerColor(globalStatus)
    _.log(globalStatus, label, color)
  }
}

const getLoggerColor = globalStatus => {
  const totalSuccesses = aggregateAttribute(globalStatus, 'success')
  const totalErrors = aggregateAttribute(globalStatus, 'errors')
  if (totalSuccesses > 0 && totalErrors > 0) return 'yellow'
  if (totalSuccesses > 0) return 'green'
  return 'red'
}

const aggregateAttribute = (globalStatus, attribute) => {
  return _.values(globalStatus)
  .map(obj => obj[attribute])
  .reduce(sum, 0)
}

const sum = (a, b) => a + b
