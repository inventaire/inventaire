#!/usr/bin/env node

// This is the alternative to [data transformation](https://github.com/inventaire/inventaire/blob/master/docs/data_transformation.md)
// to make a transformation with patches. This patch will be signed by a special user: updater

// HOW TO:
// -----------------
// - pass the path of a module exporting
//   - preview: Boolean (Default to true)
//   - silent: Boolean (Default to false)
//   - getNextBatch: Function: -> CouchDB response with include_docs=true
//   - updateFn: Function: entity doc -> updated entity doc
//   - stats: Function: -> stats object

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const entitiesDb = __.require('db', 'couchdb/base')('entities')
const patchesDb = __.require('db', 'couchdb/base')('patches')
const docDiff = __.require('db', 'couchdb/doc_diffs')
const Entity = __.require('models', 'entity')
const Patch = __.require('models', 'patch')
const userId = __.require('db', 'couchdb/hard_coded_documents').users.updater._id

const [ updateFnFilePath ] = process.argv.slice(2)
const { getNextBatch, updateFn, stats } = require(updateFnFilePath)
let { preview, silent } = require(updateFnFilePath)

// Default to true
preview = preview !== false
// Default to false
silent = silent === true

assert_.function(getNextBatch)
assert_.function(updateFn)

const updateSequentially = () => {
  return getNextBatch()
  .then(res => {
    const { rows } = res
    if (rows.length === 0) return

    const updatesData = rows.map(row => {
      const { doc: currentDoc } = row
      const updatedDoc = updateFn(_.cloneDeep(currentDoc))
      Entity.beforeSave(updatedDoc)
      if (!silent) { docDiff(currentDoc, updatedDoc, preview) }
      return { currentDoc, updatedDoc }
    })

    return postEntitiesBulk(updatesData)
    .then(postPatchesBulk(updatesData))
    .then(updateSequentially)
  })
}

const postEntitiesBulk = updatesData => entitiesDb.bulk(_.map(updatesData, 'updatedDoc'))

const postPatchesBulk = updatesData => entityBulkRes => {
  const entityResById = _.keyBy(entityBulkRes, 'id')
  const patches = updatesData.map(buildPatches(entityResById))
  return patchesDb.bulk(patches)
}

const buildPatches = entityResById => updateData => {
  const { currentDoc, updatedDoc } = updateData
  const { _id } = updatedDoc
  const entityRes = entityResById[_id]
  updatedDoc._rev = entityRes.rev
  if (updatedDoc._rev == null) throw error_.new('rev not found', 500, { updateData, entityRes })
  return Patch.create({ userId, currentDoc, updatedDoc })
}

updateSequentially()
.then(() => {
  if (stats) _.log(stats(), 'stats')
})
.catch(_.Error('global error'))
