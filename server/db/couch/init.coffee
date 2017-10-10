CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
couchInit = require 'couch-init2'
dbBaseUrl = CONFIG.db.fullHost()
initHardCodedDocuments = require './init_hard_coded_documents'

dbsList = require './list'
formattedList = []

# Adapt the list to couch-init2 needs
for dbName, designDocsNames of dbsList
  formattedList.push
    # Adding a suffix if needed
    name: CONFIG.db.name dbName
    designDocs: designDocsNames

designDocFolder = __.path('couchdb', 'design_docs')

module.exports = ->
  couchInit dbBaseUrl, formattedList, designDocFolder
  .tap initHardCodedDocuments
  .catch (err)->
    if err.message isnt 'CouchDB name or password is incorrect' then throw err

    # Avoid logging the password in plain text
    CONFIG.db.password = CONFIG.db.password.replace(/.{1}/g, '*')
    _.extend err, _.pick(CONFIG.db, 'protocol', 'host', 'port', 'username', 'password')
    _.error err, err.message, false

    process.exit 1
