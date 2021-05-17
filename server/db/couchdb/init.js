const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const couchInit = require('couch-init2')
const dbBaseUrl = CONFIG.db.fullHost()
const initHardCodedDocuments = require('./init_hard_coded_documents')
const initDesignDocSync = require('./init_design_doc_sync')

const dbsList = require('./list')
const formattedList = []

// Adapt the list to couch-init2 needs
for (const dbName in dbsList) {
  const designDocsNames = dbsList[dbName]
  formattedList.push({
    // Adding a suffix if needed
    name: CONFIG.db.name(dbName),
    designDocs: designDocsNames
  })
}

const designDocFolder = __.path('db', 'couchdb/design_docs')

const init = async () => {
  try {
    const res = await couchInit(dbBaseUrl, formattedList, designDocFolder)
    if (_.objLength(res.operations) !== 0) _.log(res, 'couch init')
    await initHardCodedDocuments()
    initDesignDocSync()
  } catch (err) {
    if (err.message !== 'CouchDB name or password is incorrect') throw err

    const context = _.pick(CONFIG.db, 'protocol', 'hostname', 'port', 'username', 'password')
    // Avoid logging the password in plain text
    context.password = _.obfuscate(context.password)
    console.error(err.message, context)
    return process.exit(1)
  }
}

let waitForCouchInit

module.exports = () => {
  // Return the same promises to all consumers
  waitForCouchInit = waitForCouchInit || init()
  return waitForCouchInit
}
