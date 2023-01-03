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

import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import docDiff from '#db/couchdb/doc_diffs'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { error_ } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { log, LogError } from '#lib/utils/logs'
import Entity from '#models/entity'
import Patch from '#models/patch'

const entitiesDb = dbFactory('entities')
const patchesDb = dbFactory('patches')
const userId = hardCodedUsers.updater._id

const [ updateFnFilePath ] = process.argv.slice(2)
const { getNextBatch, updateFn, stats } = await import(updateFnFilePath)
let { preview, silent } = await import(updateFnFilePath)

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
  if (stats) log(stats(), 'stats')
})
.catch(LogError('global error'))
