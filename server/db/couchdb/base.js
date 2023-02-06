import CONFIG from 'config'
import _ from '#builders/utils'
import bundlesFactory from '#db/couchdb/bundles'
import { databases } from '#db/couchdb/databases'
import { memoize } from '#lib/utils/memoize'
import getDbApi from './cot_base.js'

export default (dbBaseName, designDocName) => {
  const dbName = CONFIG.db.name(dbBaseName)
  // If no designDocName is provided while there are defined design docs for this database,
  // assumes that it is the default design doc, which has the same name as the dbBaseName
  if (databases[dbBaseName].length > 0 && designDocName == null) {
    designDocName = dbBaseName
  }
  return getHandler(dbBaseName, dbName, designDocName)
}

const getHandler = memoize((dbBaseName, dbName, designDocName) => {
  validate(dbBaseName, designDocName)
  const db = getDbApi(dbName, designDocName)
  const bundles = bundlesFactory(db, _)
  return Object.assign(db, bundles, { dbBaseName, dbName, designDocName })
})

// Not using error_ as that would make hard to solve cirucular dependencies
const validate = (dbBaseName, designDocName) => {
  if (!databases[dbBaseName]) {
    throw new Error(`unknown dbBaseName: ${dbBaseName}`)
  }

  const jsDesignDocName = `${designDocName}.js`

  if (designDocName && !(databases[dbBaseName].includes(designDocName) || databases[dbBaseName].includes(jsDesignDocName))) {
    throw new Error(`unknown designDocName: ${designDocName}`)
  }
}
