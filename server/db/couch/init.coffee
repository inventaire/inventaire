CONFIG = require 'config'
__ = CONFIG.universalPath
couchInit = require 'couch-init2'
dbBaseUrl = CONFIG.db.fullHost()

dbsList = require('inv-dbs-list').default
formattedList = []

# adapt the list to couch-init2 needs
for dbName, designDocsNames of dbsList
  formattedList.push
    # adding a suffix if needed
    name: CONFIG.db.name(dbName)
    designDocs: designDocsNames

designDocFolder = __.path('couchdb', 'design_docs')

module.exports = -> couchInit dbBaseUrl, formattedList, designDocFolder
