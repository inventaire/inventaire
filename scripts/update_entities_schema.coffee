#!/usr/bin/env coffee

# This is the alternative to ./migrator for entities, as entities doc edits require
# to also create patch documents. This patch will be signed by a special user: schemaUpdater

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
entities_ = __.require 'controllers', 'entities/lib/entities'
patches_ = __.require 'controllers', 'entities/lib/patches'
{ maxKey } = __.require 'lib', 'couch'
docDiff = __.require 'couchdb', 'doc_diffs'
Patch = __.require 'models', 'patch'
userId = __.require('couch', 'hard_coded_documents').users.schemaUpdater._id

[ updateFnFilePath, preview ] = process.argv.slice 2
{ preview, getNextBatch, updateFn, stats } = require updateFnFilePath

preview = preview ?= true
silent = silent ?= false

_.type getNextBatch, 'function'
_.type updateFn, 'function'

updateSequentially = ->
  getNextBatch()
  .then (res)->
    { rows } = res
    if rows.length is 0 then return

    updatesData = buildUpdatesData rows

    if preview then return updateSequentially()

    postBulks updatesData
    .then updateSequentially

buildUpdatesData = (rows)->
  _.pluck rows, 'doc'
  .map prepareUpdates
  .reduce aggregateUpdates, { entities: [], patches: [] }

prepareUpdates = (currentDoc)->
  updatedDoc = updateFn _.cloneDeep(currentDoc)
  # Anticipate the rev incrementation that will happen once entities are posted
  # on which the patch id depends
  patch = Patch.create { userId, currentDoc, updatedDoc, beforeEntityRevUpdate: true }
  if silent
    docDiff currentDoc, updatedDoc, preview
    _.log patch, 'patch'
  return { entity: updatedDoc, patch }

aggregateUpdates = (data, updateData)->
  data.entities.push updateData.entity
  data.patches.push updateData.patch
  return data

postBulks = (updatesData)->
  { entities, patches } = updatesData
  entities_.db.bulk entities
  .then -> patches_.db.bulk patches

updateSequentially()
.then -> if stats? then _.log stats(), 'stats'
.catch _.Error('global error')
