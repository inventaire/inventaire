const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const getDbApi = require('./cot_base')
const memoize = __.require('lib', 'utils/memoize')

// If no designDocName is provided,
// assumes it is the same as the dbBaseName
module.exports = (dbBaseName, designDocName) => {
  const dbName = CONFIG.db.name(dbBaseName)
  if (!designDocName) designDocName = dbBaseName
  return getHandler(dbName, designDocName)
}

const getHandler = memoize((dbName, designDocName) => {
  const db = getDbApi(dbName, designDocName)
  const bundles = require('./bundles')(db, _)
  return Object.assign(db, bundles)
})
