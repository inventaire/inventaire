CONFIG = require 'config'
fs = require 'fs'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
# cant use users and items cot-db
# as it would create a require loop
promises_ = __.require 'lib', 'promises'
breq = require('bluereq')

module.exports =
  designDoc:
    load: (dbBaseName, designDocName)->
      _.info "#{designDocName} design doc loader"
      url = getDbUrl dbBaseName
      designDoc = getDesignDoc designDocName
      label = "load #{dbBaseName}/#{designDoc.id}"

      breq.post url, designDoc.body()
      .then _.property('body')
      .then _.Success(label)
      .catch _.Error(label)

    update: (dbBaseName, designDocName)->
      _.info "#{designDocName} design doc updater"
      dbUrl = getDbUrl dbBaseName
      designDoc = getDesignDoc designDocName
      label = "update #{dbBaseName}/#{designDoc.id}"

      docUrl = dbUrl + '/' + designDoc.id

      promises_.get docUrl
      .then updateIfNeeded.bind(null, docUrl, designDoc.body())
      .catch _.Error(label)

  putSecurityDoc: (dbName)->
    docPath = "/#{dbName}/_security"
    _.log docPath, 'doc path'
    url = baseDbUrl + docPath

    breq.put url, _securityDoc
    .then _.property('body')
    .then _.Info('putSecurityDoc')
    .catch _.Error('putSecurityDoc')

  loadFakeUsers: require './load_fake_users'


updateIfNeeded = (url, update, current)->
  unless _.objDiff update.views, current.views
    return _.info "#{update._id} already up-to-date"

  update._rev = current._rev

  breq.put url, update
  .then _.property('body')
  .then _.Success(label)

getDesignDoc = (designDocName)->
  return doc =
    name: "#{designDocName}"
    id: "_design/#{designDocName}"
    path: __.path 'couchdb', "design_docs/#{designDocName}.json"
    body: -> getOrCreateDesignDoc(@path, designDocName)

getOrCreateDesignDoc = (path, designDocName)->
  try require path
  catch err
    _.warn err, "#{designDocName} designDoc not found: creating"
    createDefaultDesignDoc(path, designDocName)

createDefaultDesignDoc = (path, designDocName)->
  doc = defaultDesignDoc(designDocName)
  _.jsonWrite path, doc
  _.success doc, "#{designDocName} design doc initialized at #{path}"
  return doc

defaultDesignDoc = (designDocName)->
  return defaultDoc =
    _id: "_design/#{designDocName}"
    language: "coffeescript"

baseDbUrl = CONFIG.db.fullHost()

getDbUrl = (dbBaseName)->
  dbName = CONFIG.db.name(dbBaseName)
  "#{baseDbUrl}/#{dbName}"


_securityDoc = __.require 'couchdb', 'security_doc'
