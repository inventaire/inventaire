/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const Promise = require('bluebird')
Promise.longStackTraces()
const fs = require('fs')
const updateDocsByBatch = require('./update_docs_by_batch')

module.exports = function(params){
  let db, log
  let { dbName, designDocName, preview, silent, showDiff } = params
  params.preview = preview != null ? preview : (preview = true)
  params.silent = silent != null ? silent : (silent = false)
  if (params.showDiff == null) { params.showDiff = true }
  params.log = (log = silent ? _.identity : _.log)
  const Log = label => obj => log(obj, label)

  console.log('preview mode:', preview)
  console.log('silent mode:', silent)

  params.db = (db = __.require('couch', 'base')(dbName, designDocName))
  if (db == null) throw new Error('bad dbName')

  const updater = function(docsIdsPromise, updateFunction, label){
    if (!preview) { logMigration(dbName, updateFunction, label) }

    params.updateFunction = updateFunction

    return docsIdsPromise
    .filter(isntDesignDoc)
    .then(updateDocsByBatch(params))
  }

  const API = {
    updateAll(updateFunction, label){
      return updater(getAllDocsKeys(), updateFunction, label)
    },

    updateByView(viewName, updateFunction, label){
      return updater(getViewKeys(viewName), updateFunction, label)
    }
  }

  var getAllDocsKeys = () => db.allDocsKeys()
  .then((res) => {
    const rows = res.rows.filter(row => !row.id.startsWith('_design/'))
    const ids = _.map(rows, 'id')
    return _.success(ids, 'doc ids found')}).catch(_.ErrorRethrow('getAllDocsKeys error'))

  var getViewKeys = viewName => db.view(designDocName, viewName, { reduce: false })
  .then(res => res.rows.map(_.property('id')))
  .then(Log('view ids'))

  return API
}

var logMigration = function(dbName, updateFunction, label = 'updateFunction'){
  const date = new Date().toJSON()
  const name = `migrations/${dbName}-${date}.json`
  const path = __.path('couchdb', name)
  const obj = {}
  obj[label] = updateFunction.toString()
  _.log(obj, 'obj')
  const json = JSON.stringify(obj, null, 4)
  fs.writeFileSync(path, json)
  return _.success(`migration logged at ${path}: ${json}`)
}

var isntDesignDoc = id => !/^_design/.test(id)
