__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
Promise.longStackTraces()
fs = require 'fs'
updateDocsByBatch = require './update_docs_by_batch'

module.exports = (params)->
  { dbName, designDocName, preview, silent, showDiff } = params
  params.preview = preview ?= true
  params.silent = silent ?= false
  params.showDiff ?= true
  params.log = log = if silent then _.identity else _.log
  Log = (label)-> (obj)-> log obj, label

  console.log 'preview mode:', preview
  console.log 'silent mode:', silent

  params.db = db = __.require('couch', 'base')(dbName, designDocName)
  unless db? then throw new Error('bad dbName')

  updater = (docsIdsPromise, updateFunction, label)->
    unless preview then logMigration dbName, updateFunction, label

    params.updateFunction = updateFunction

    docsIdsPromise
    .filter isntDesignDoc
    .then updateDocsByBatch(params)

  API =
    updateAll: (updateFunction, label)->
      updater getAllDocsKeys(), updateFunction, label

    updateByView: (viewName, updateFunction, label)->
      updater getViewKeys(viewName), updateFunction, label

  getAllDocsKeys = ->
    db.allDocsKeys()
    .then (res)->
      rows = res.rows.filter (row)-> not row.id.startsWith('_design/')
      ids = _.map rows, 'id'
      return _.success ids, 'doc ids found'
    .catch _.ErrorRethrow('getAllDocsKeys error')

  getViewKeys = (viewName)->
    db.view designDocName, viewName
    .then (res)-> res.rows.map _.property('id')
    .then Log('view ids')

  return API

logMigration = (dbName, updateFunction, label = 'updateFunction')->
  date = new Date().toJSON()
  name = "migrations/#{dbName}-#{date}.json"
  path = __.path('couchdb', name)
  obj = {}
  obj[label] = updateFunction.toString()
  _.log obj, 'obj'
  json = JSON.stringify obj, null, 4
  fs.writeFileSync(path, json)
  _.success "migration logged at #{path}: #{json}"

isntDesignDoc = (id)-> not /^_design/.test id
