__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
Promise.longStackTraces()
fs = require 'fs'


# HOW TO:
# -----------------
# dbName = 'inventory' (e.g.)
# mig = require('config').universalPath.require('couchdb', 'migration')(dbName)
# updateFunction = (doc)-> if doc.type is 'targetedType' (do your thing) return doc
# mig.updateAll(updateFunction)

# OR
# dbName = 'users' (e.g.)
# designDocName = 'user'
# viewName = 'byId'
# mig = require('config').universalPath.require('couchdb', 'migration')(dbName, designDocName)
# updateFunction = (doc)-> if doc.type is 'targetedType' (do your thing) return doc
# mig.updateByView(viewName, updateFunction)


module.exports = (dbName, designDocName)->
  db = __.require('couch', 'cot_base')(dbName, designDocName)
  unless db? then throw new Error('bad dbName')

  updater = (docsIdsPromise, updateFunction, label)->
    _.log typeof docsIdsPromise, 'typeof docsIdsPromise'
    logMigration(dbName, updateFunction, label)
    console.log 'updating'
    docsIdsPromise
    .then (ids)->
      _.log ids, 'got ids'
      promises = []
      ids.forEach (id)->
        unless isDesignDoc(id)
          _.log id, 'id'
          promises.push db.update(id, updateFunction)

      Promise.all(promises)
      .then _.Success('done updating !!')
    .catch (err)->
      _.error err, 'migration error'
      throw new Error(err)

  API =
    db: db
    updateAll: (updateFunction, label)->
      updater @getAllDocsKeys(), updateFunction, label

    getAllDocsKeys: ->
      db.allDocsKeys()
      .then (res)->
        ids = _.pluck res.rows, 'id'
        return _.success ids, 'doc ids found'
      .catch (err)->
        _.error err, 'getAllDocsKeys error'
        throw new Error(err)

    updateByView: (viewName, updateFunction, label)->
      # console.log 'UPDATER', updater
      updater @getViewKeys(viewName), updateFunction, label

    getViewKeys: (viewName)->
      db.view designDocName, viewName
      .then (res)->
        return res.rows.map _.property('id')
      .then _.Log('view ids')
      # .catch _.Error('getViewKeys')

  return API


logMigration = (dbName, updateFunction, label='updateFunction')->
  date = new Date().toJSON()
  name = "migrations/#{dbName}-#{date}.json"
  path = __.path('couchdb', name)
  obj = {}
  obj[label] = updateFunction.toString()
  _.log obj, 'obj'
  json = JSON.stringify obj, null, 4
  fs.writeFileSync(path, json)
  _.success "migration logged at #{path}: #{json}"

isDesignDoc = (id)-> /^_design/.test id