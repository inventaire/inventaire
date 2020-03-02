const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const fs = require('fs')
const updateDocsByBatch = require('./update_docs_by_batch')

module.exports = params => {
  const { dbName, designDocName } = params

  // Default to true
  params.preview = params.preview !== false
  // Default to false
  params.silent = params.silent === true
  // Default to true
  params.showDiff = params.showDiff !== false

  const { preview, silent } = params

  const log = params.log = (silent ? _.identity : _.log)
  const Log = label => obj => log(obj, label)

  console.log('preview mode:', preview)
  console.log('silent mode:', silent)

  const db = params.db = __.require('couch', 'base')(dbName, designDocName)
  if (db == null) throw new Error('bad dbName')

  const updater = (docsIdsPromise, updateFunction, label) => {
    if (!preview) { logMigration(dbName, updateFunction, label) }

    params.updateFunction = updateFunction

    return docsIdsPromise
    .then(docIds => docIds.filter(isntDesignDoc))
    .then(updateDocsByBatch(params))
  }

  const API = {
    updateAll: (updateFunction, label) => {
      return updater(getAllDocsKeys(), updateFunction, label)
    },

    updateByView: (viewName, updateFunction, label) => {
      return updater(getViewKeys(viewName), updateFunction, label)
    }
  }

  const getAllDocsKeys = () => {
    return db.allDocsKeys()
    .then(res => {
      const rows = res.rows.filter(row => !row.id.startsWith('_design/'))
      const ids = _.map(rows, 'id')
      return _.success(ids, 'doc ids found')
    })
    .catch(_.ErrorRethrow('getAllDocsKeys error'))
  }

  const getViewKeys = viewName => {
    return db.view(designDocName, viewName, { reduce: false })
    .then(res => res.rows.map(_.property('id')))
    .then(Log('view ids'))
  }

  return API
}

const logMigration = (dbName, updateFunction, label = 'updateFunction') => {
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

const isntDesignDoc = id => !/^_design/.test(id)
