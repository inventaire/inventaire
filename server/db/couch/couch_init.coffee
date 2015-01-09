CONFIG = require 'config'
fs = require 'fs'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
# cant use users and inventory cot-db
# as it would create a require loop
bluereq = require 'bluereq'

module.exports =
  designDoc:
    load: (dbName)->
      _.info "#{dbName} design doc loader"
      url = getDbUrl(dbName)
      designDoc = getDesignDoc(dbName)
      bluereq.post url, designDoc.body()
      .then (res)-> _.success res.body, "#{designDoc.id} for #{url}"
      .catch (err)-> _.error err.body or err, "#{designDoc.id} for #{url}"

    update: (dbName)->
      _.info "#{dbName} design doc updater"
      url = getDbUrl(dbName)
      designDoc = getDesignDoc(dbName)
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
    .catch (err)-> _.error err, 'putSecurityDoc'

  loadFakeUsers: require './load_fake_users'


getDesignDoc = (dbName)->
  return doc =
    name: "#{dbName}"
    id: "_design/#{dbName}"
    path: __.path 'couchdb', "design_docs/#{dbName}.json"
    body: -> _.jsonRead @path

baseDbUrl = CONFIG.db.fullHost()

getDbUrl = (dbName)->
  customDbName = CONFIG.db.name(dbName)
  "#{baseDbUrl}/#{customDbName}"


_securityDoc = (->
  username = CONFIG.db.username
  unless _.isString(username) then throw "bad CONFIG.db.username: #{username}"

  return securityDoc =
    admins:
      names: [username]
    members:
      names: [username]
  )()
