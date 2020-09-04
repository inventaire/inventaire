const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { post } = __.require('lib', 'requests')
const { host: elasticHost } = CONFIG.elasticsearch

const bulk = module.exports = {
  buildLine: (action, index, type, id) => {
    return `{"${action}":{"_index":"${index}","_type":"${type}","_id":"${id}"}}`
  },

  joinLines: lines => {
    if (!(lines instanceof Array && lines.length > 0)) {
      throw new Error('invalid lines')
    }
    // It is required to end by a newline break
    return lines.join('\n') + '\n'
  },

  logRes: label => async ({ items }) => {
    const globalStatus = {}

    items.forEach(item => {
      for (const operation in item) {
        const opRes = item[operation]
        if (globalStatus[operation] == null) {
          globalStatus[operation] = { success: 0, error: 0 }
        }
        if (opRes.status >= 400) {
          if (opRes.status === 404) {
            // Known case: happens when an unindexation is requested before the indexation was done
            _.warn(opRes._id, `${label} not found`)
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
  },

  postBatch: batch => {
    return post(`${elasticHost}/_bulk`, {
      headers: { 'Content-Type': 'application/json' },
      body: bulk.joinLines(batch)
    })
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
