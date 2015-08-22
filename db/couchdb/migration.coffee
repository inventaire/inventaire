__ = require('config').root
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
Promise.longStackTraces()
fs = require 'fs'


# HOW TO:
# -----------------
# dbName = 'inventory' (e.g.)
# mig = require('config').root.require('couchdb', 'migration')(dbName)
# updateFunction = (doc)-> if doc.type is 'targetedType' (do your thing) return doc
# mig.updateAll(updateFunction)


module.exports = (dbName)->
  db = __.require('couch', 'base')(dbName)
  unless db? then throw new Error('bad dbName')
  API =
    db: db
    updateAll: (updateFunction, label)->
      @logMigration(updateFunction, label)
      @getAllDocsKeys()
      .then (ids)->
        promises = []
        ids.forEach (id)->
          unless isDesignDoc(id)
            _.log id, 'id'
            promises.push db.update(id, updateFunction)

        Promise.all(promises)
        .then -> _.success 'done updating !!'
        .catch (err)->
          _.error err, 'migration error'
          throw new Error(err)

    getAllDocsKeys: ->
      db.allDocsKeys()
      .then (res)->
        ids = _.pluck res.rows, 'id'
        return _.success ids, 'doc ids found'
      .catch (err)->
        _.error err, 'getAllDocsKeys error'
        throw new Error(err)

    logMigration: (updateFunction, label='updateFunction')->
      date = new Date().toJSON()
      name = "migrations/#{dbName}-#{date}.json"
      path = __.path('couchdb', name)
      obj = {}
      obj[label] = updateFunction.toString()
      _.log obj, 'obj'
      json = JSON.stringify obj, null, 4
      fs.writeFileSync(path, json)
      _.success "migration logged at #{path}: #{json}"

  return API

isDesignDoc = (id)-> /^_design/.test id