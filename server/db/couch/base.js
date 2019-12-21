const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const getDbApi = require('./cot_base')
const memoize = __.require('lib', 'utils/memoize')
const list = require('./list')

module.exports = (dbBaseName, designDocName) => {
  const dbName = CONFIG.db.name(dbBaseName)
  // If no designDocName is provided,
  // assumes it is the same as the dbBaseName
  designDocName = designDocName || dbBaseName
  return getHandler(dbBaseName, dbName, designDocName)
}

const getHandler = memoize((dbBaseName, dbName, designDocName) => {
  validate(dbBaseName, designDocName)
  const db = getDbApi(dbName, designDocName)
  const bundles = require('./bundles')(db, _)
  return Object.assign(db, bundles)
})

// Not using error_ as that would make hard to solve cirucular dependencies
const validate = (dbBaseName, designDocName) => {
  if (!list[dbBaseName]) {
    throw new Error(`unknown dbBaseName: ${dbBaseName}`)
  }

  if (!(list[dbBaseName].includes(designDocName))) {
    throw new Error(`unknown designDocName: ${designDocName}`)
  }
}
