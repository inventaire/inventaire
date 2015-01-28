CONFIG = require 'config'
fs = require 'fs'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
# cant use users and items cot-db
# as it would create a require loop
bluereq = require 'bluereq'

module.exports =
  designDoc:
    load: (dbBaseName)->
      _.info "#{dbBaseName} design doc loader"
      url = getDbUrl(dbBaseName)
      designDoc = getDesignDoc(dbBaseName)
      bluereq.post url, designDoc.body()
      .then (res)-> _.success res.body, "#{designDoc.id} for #{url}"
      .catch (err)-> _.error err.body or err, "#{designDoc.id} for #{url}"

    update: (dbBaseName)->
      _.info "#{dbBaseName} design doc updater"
      url = getDbUrl(dbBaseName)
      designDoc = getDesignDoc(dbBaseName)
      bluereq.get url + '/' + designDoc.id
      .then (res)->
        _.log res.body, 'current'
        update = designDoc.body()
        update._rev = res.body._rev
        url = url + '/' + update._id
        bluereq.put(url, update)
        .then (res)-> _.success res.body, "#{designDoc.id} for #{url}"
      .catch (err)-> _.error err.body or err, "#{designDoc.id} for #{url}"

  putSecurityDoc: (dbBaseName)->
    url = baseDbUrl + "/#{dbBaseName}/_security"
    _.log url, 'url'
    bluereq.put url, _securityDoc
    .then (res)-> _.info res.body, 'putSecurityDoc'
    .catch (err)-> _.error err, 'putSecurityDoc'

  loadFakeUsers: require './load_fake_users'


getDesignDoc = (dbBaseName)->
  return doc =
    name: "#{dbBaseName}"
    id: "_design/#{dbBaseName}"
    path: __.path 'couchdb', "design_docs/#{dbBaseName}.json"
    body: -> getOrCreateDesignDoc(@path, dbBaseName)

getOrCreateDesignDoc = (path, dbBaseName)->
  try _.jsonRead path
  catch err
    _.log err, "#{dbBaseName} designDoc not found: creating"
    createDefaultDesignDoc(path, dbBaseName)

createDefaultDesignDoc = (path, dbBaseName)->
  doc = defaultDesignDoc(dbBaseName)
  _.jsonWrite path, doc
  _.success doc, "#{dbBaseName} design doc initialized at #{path}"
  return doc

defaultDesignDoc = (dbBaseName)->
  return defaultDoc =
    _id: "_design/#{dbBaseName}"
    language: "coffeescript"

baseDbUrl = CONFIG.db.fullHost()

getDbUrl = (dbBaseName)->
  dbName = CONFIG.db.name(dbBaseName)
  "#{baseDbUrl}/#{dbName}"


_securityDoc = (->
  username = CONFIG.db.username
  unless _.isString(username) then throw "bad CONFIG.db.username: #{username}"

  return securityDoc =
    admins:
      names: [username]
    members:
      names: [username]
  )()
