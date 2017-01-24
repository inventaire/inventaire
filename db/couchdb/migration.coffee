__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
Promise.longStackTraces()
fs = require 'fs'

module.exports = (params)->
  { dbName, designDocName, preview, silent } = params
  preview ?= true
  silent ?= false

  db = __.require('couch', 'cot_base')(dbName, designDocName)
  unless db? then throw new Error('bad dbName')

  log = if silent then _.identity else _.log
  Log = (label)-> (obj)-> log obj, label
  docDiff = if silent then _.noop else require('./doc_diffs')

  console.log 'preview mode:', preview
  console.log 'silent mode:', silent

  updater = (docsIdsPromise, updateFunction, label)->
    unless preview then logMigration dbName, updateFunction, label

    docsIdsPromise
    .then (ids)->
      log ids, 'got ids'
      promises = []
      ids.forEach (id)->
        unless isDesignDoc id
          log id, 'id'
          promises.push updateIfNeeded(id, updateFunction)

      return Promise.all promises

    .then -> log 'done updating !!'
    .catch _.ErrorRethrow('migration error')

  updateIfNeeded = (id, updateFn)->
    db.get id
    .then (doc)->
      # use a clone of the doc to keep it unmuted
      update = updateFn _.cloneDeep(doc)
      if _.objDiff doc, update
        docDiff doc, update, preview
        return db.update id, updateFn
      else
        log id, 'no changes'
        return

  API =
    db: db
    updateAll: (updateFunction, label)->
      updater @getAllDocsKeys(), updateFunction, label

    getAllDocsKeys: ->
      db.allDocsKeys()
      .then (res)->
        ids = _.pluck res.rows, 'id'
        return _.success ids, 'doc ids found'
      .catch _.ErrorRethrow('getAllDocsKeys error')

    updateByView: (viewName, updateFunction, label)->
      updater @getViewKeys(viewName), updateFunction, label

    getViewKeys: (viewName)->
      db.view designDocName, viewName
      .then (res)-> return res.rows.map _.property('id')
      .then Log('view ids')

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