const CONFIG = require('config')
const _ = require('builders/utils')
const getDbApi = require('./cot_base')
const memoize = require('lib/utils/memoize')
const list = require('./list')

module.exports = (dbBaseName, designDocName) => {
  const dbName = CONFIG.db.name(dbBaseName)
  // If no designDocName is provided while there are defined design docs for this database,
  // assumes that it is the default design doc, which has the same name as the dbBaseName
  if (list[dbBaseName].length > 0 && designDocName == null) {
    designDocName = dbBaseName
  }
  return getHandler(dbBaseName, dbName, designDocName)
}

const getHandler = memoize((dbBaseName, dbName, designDocName) => {
  validate(dbBaseName, designDocName)
  const db = getDbApi(dbName, designDocName)
  const bundles = require('./bundles')(db, _)
  return Object.assign(db, bundles, { dbBaseName, dbName, designDocName })
})

// Not using error_ as that would make hard to solve cirucular dependencies
const validate = (dbBaseName, designDocName) => {
  if (!list[dbBaseName]) {
    throw new Error(`unknown dbBaseName: ${dbBaseName}`)
  }

  if (designDocName && !list[dbBaseName].includes(designDocName)) {
    throw new Error(`unknown designDocName: ${designDocName}`)
  }
}
