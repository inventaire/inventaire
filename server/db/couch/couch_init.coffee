CONFIG = require 'config'
fs = require 'fs'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
# cant use users and items cot-db
# as it would create a require loop
bluereq = require 'bluereq'

module.exports =
  designDoc:
    load: (dbBaseName, designDocName)->
      _.info "#{designDocName} design doc loader"
      url = getDbUrl(dbBaseName)
      designDoc = getDesignDoc(designDocName)
      bluereq.post url, designDoc.body()
      .then (res)-> _.success res.body, "#{designDoc.id} for #{url}"
      .catch (err)-> _.error err.body or err, "#{designDoc.id} for #{url}"

    update: (dbBaseName, designDocName)->
      _.info "#{designDocName} design doc updater"
      url = getDbUrl(dbBaseName)
      designDoc = getDesignDoc(designDocName)
      bluereq.get url + '/' + designDoc.id
      .then (res)->
        _.log res.body, 'current'
        update = designDoc.body()
        update._rev = res.body._rev
        url = url + '/' + update._id
        bluereq.put(url, update)
        .then (res)-> _.success res.body, "#{designDoc.id} for #{url}"
      .catch (err)-> _.error err.body or err, "#{designDoc.id} for #{url}"

  putSecurityDoc: (dbName)->
    url = baseDbUrl + "/#{dbName}/_security"
    _.log url, 'url'
    bluereq.put url, _securityDoc
    .then (res)-> _.info res.body, 'putSecurityDoc'
    .catch _.Error('putSecurityDoc')

  loadFakeUsers: require './load_fake_users'


getDesignDoc = (designDocName)->
  return doc =
    name: "#{designDocName}"
    id: "_design/#{designDocName}"
    path: __.path 'couchdb', "design_docs/#{designDocName}.json"
    body: -> getOrCreateDesignDoc(@path, designDocName)

getOrCreateDesignDoc = (path, designDocName)->
  try _.jsonRead path
  catch err
    _.log err, "#{designDocName} designDoc not found: creating"
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
