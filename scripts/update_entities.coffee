#!/usr/bin/env coffee

# This is the alternative to ./migrator for entities, as entities doc edits require
# to also create patch documents. This patch will be signed by a special user: updater

# HOW TO:
# -----------------
# - pass the path of a module exporting
#   - preview: Boolean (Default to true)
#   - silent: Boolean (Default to false)
#   - getNextBatch: Function: -> CouchDB response with include_docs=true
#   - updateFn: Function: entity doc -> updated entity doc
#   - stats: Function: -> stats object

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = __.require 'controllers', 'entities/lib/entities'
patches_ = __.require 'controllers', 'entities/lib/patches'
{ maxKey } = __.require 'lib', 'couch'
docDiff = __.require 'couchdb', 'doc_diffs'
Patch = __.require 'models', 'patch'
userId = __.require('couch', 'hard_coded_documents').users.updater._id

[ updateFnFilePath ] = process.argv.slice 2
{ preview, silent, getNextBatch, updateFn, stats } = require updateFnFilePath

preview = preview ?= true
silent = silent ?= false

_.type getNextBatch, 'function'
_.type updateFn, 'function'

updateSequentially = ->
  getNextBatch()
  .then (res)->
    { rows } = res
    if rows.length is 0 then return

    updatesData = rows.map (row)->
      { doc: currentDoc } = row
      updatedDoc = updateFn _.cloneDeep(currentDoc)
      unless silent then docDiff currentDoc, updatedDoc, preview
      return { currentDoc, updatedDoc }

    postEntitiesBulk updatesData
    .then postPatchesBulk(updatesData)
    .then updateSequentially

postEntitiesBulk = (updatesData)->
  entities_.db.bulk _.map(updatesData, 'updatedDoc')

postPatchesBulk = (updatesData)-> (entityBulkRes)->
  entityResById = _.keyBy entityBulkRes, 'id'
  patches = updatesData.map buildPatches(entityResById)
  return patches_.db.bulk patches

buildPatches = (entityResById)-> (updateData)->
  { currentDoc, updatedDoc } = updateData
  { _id } = updatedDoc
  entityRes = entityResById[_id]
  updatedDoc._rev = entityRes.rev
  unless updatedDoc._rev? then throw error_.new 'rev not found', 500, { updateData, entityRes }
  return Patch.create { userId, currentDoc, updatedDoc }

updateSequentially()
.then -> if stats? then _.log stats(), 'stats'
.catch _.Error('global error')
