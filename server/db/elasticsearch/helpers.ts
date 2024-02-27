import { log, warn } from '#lib/utils/logs'

export const activeI18nLangs = 'ar bn ca cs da de el en eo es fr hu id it ja nb nl pa pl pt ro ru sk sv tr uk'.split(' ')

export function logBulkRes (res, label) {
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
            warn(`can't deindex: doc not found ${opRes._id}`)
          } else {
            warn(`${label} not found ${opRes._id}`)
          }
        } else {
          warn(item, `${label} failed`)
        }
        globalStatus[operation].error++
      } else {
        globalStatus[operation].success++
      }
    }
  })

  const color = getLoggerColor(globalStatus)
  log(globalStatus, label, color)
}

const getLoggerColor = globalStatus => {
  const totalSuccesses = aggregateAttribute(globalStatus, 'success')
  const totalErrors = aggregateAttribute(globalStatus, 'errors')
  if (totalSuccesses > 0 && totalErrors > 0) return 'yellow'
  if (totalSuccesses > 0) return 'green'
  return 'red'
}

const aggregateAttribute = (globalStatus, attribute) => {
  return Object.values(globalStatus)
  .map(obj => obj[attribute])
  .reduce(sum, 0)
}

const sum = (a, b) => a + b
