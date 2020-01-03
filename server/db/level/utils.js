const __ = require('config').universalPath
const { forceArray } = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')

const streamPromise = stream => new Promise((resolve, reject) => {
  const results = []
  return stream
  .on('data', results.push.bind(results))
  .on('end', () => resolve(results))
  .on('error', reject)
})

module.exports = {
  streamPromise,

  reset: db => {
    return streamPromise(db.createKeyStream())
    .then(keys => {
      const ops = keys.map(key => ({ type: 'del', key }))
      return db.batch(ops)
    })
  },

  formatBatchOps: ops => forceArray(ops).map(setDefaultType),

  // Levelup rejects `null` or `undefined` values, so the empty value should
  // be an empty string.
  // Useful when the key alone stores all the data that needs to be stored
  emptyValue: ''
}

const setDefaultType = operation => {
  operation.type = operation.type || 'put'
  return operation
}
