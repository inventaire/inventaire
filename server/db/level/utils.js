const __ = require('config').universalPath
const { forceArray } = __.require('builders', 'utils')

module.exports = {
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
