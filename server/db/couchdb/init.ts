import { mapKeys, pick } from 'lodash-es'
import { couchInit } from '#db/couchdb/init/couch_init'
import { obfuscate, objLength } from '#lib/utils/base'
import { log } from '#lib/utils/logs'
import config from '#server/config'
import { databases } from './databases.js'

const setPreloadSuffix = preload => (_, designDocsName) => preload ? `${designDocsName}_preload` : designDocsName

async function init ({ preload }) {
  try {
    const formattedList = Object.entries(databases)
      .map(([ dbName, dbDesignDocs ]) => {
        return {
          name: config.db.name(dbName),
          designDocs: mapKeys(dbDesignDocs, setPreloadSuffix(preload)),
        }
      })
    const res = await couchInit(formattedList)
    if (objLength(res.operations) !== 0) log(res, 'couch init')
    // Work around circular dependencies
    setImmediate(afterInit)
  } catch (err) {
    if (err.message !== 'CouchDB name or password is incorrect') throw err

    const context = pick(config.db, 'protocol', 'hostname', 'port', 'username', 'password')
    // Avoid logging the password in plain text
    context.password = context.password.slice(0, 2) + obfuscate(context.password.slice(2, -1)) + context.password.at(-1)
    console.error(err.message, context)
    return process.exit(1)
  }
}

let _waitForCouchInit

export async function waitForCouchInit (options = { preload: false }) {
  // Return the same promises to all consumers
  _waitForCouchInit = _waitForCouchInit || init(options)
  return _waitForCouchInit
}

async function afterInit () {
  const { default: initHardCodedDocuments } = await import('./init_hard_coded_documents.js')
  await initHardCodedDocuments()
}
