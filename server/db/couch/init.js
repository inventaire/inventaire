
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
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

const designDocFolder = __.path('couchdb', 'design_docs')

module.exports = () => couchInit(dbBaseUrl, formattedList, designDocFolder)
.tap(initHardCodedDocuments)
.tap(initDesignDocSync)
.catch(err => {
  if (err.message !== 'CouchDB name or password is incorrect') throw err

  const context = _.pick(CONFIG.db, 'protocol', 'host', 'port', 'username', 'password')
  // Avoid logging the password in plain text
  context.password = _.obfuscate(context.password)
  console.error(err.message, context)
  return process.exit(1)
})
