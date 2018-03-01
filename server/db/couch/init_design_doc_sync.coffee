# Keep the design doc files in sync with CouchDB design docs
# once CouchDB design docs were updated to match the design doc files
# This allows to modify design docs in CouchDB GUI instead of having
# to change files manually, with all the formatting implied.
# This only make sense in development

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fs_ = __.require 'lib', 'fs'
follow = __.require 'lib', 'follow'
dbsList = require './list'
designDocFolder = __.path 'couchdb', 'design_docs'

module.exports = ->
  unless CONFIG.db.enableDesignDocSync then return
  # Wait for the end of the server initalization
  setTimeout init, 2000

init = ->
  for dbBaseName, designDocsNames of dbsList
    follow
      dbBaseName: dbBaseName
      filter: isDesignDoc designDocsNames
      onChange: syncDesignDocFile

isDesignDoc = (designDocsNames)-> (doc)->
  [ prefix, designDocsName ] = doc._id.split('/')
  if prefix isnt '_design' then return false
  # Design docs that aren't in the list aren't persisted:
  # this allows to have draft design docs in CouchDB that aren't worth
  # to be tracked by git without turning them into untracked files
  if designDocsName not in designDocsNames then return false
  return true

syncDesignDocFile = (change)->
  { id, doc } = change
  designDocName = id.split('/')[1]
  designDocPath = "#{designDocFolder}/#{designDocName}.json"

  updatedDesignDoc = formatDesignDoc doc

  fs_.readFile designDocPath, { encoding: 'utf-8' }
  .then (file)->
    if updatedDesignDoc is file then return
    fs_.writeFile designDocPath, updatedDesignDoc
    .then -> _.success "#{designDocName} design doc updated"
  .catch _.Error("#{designDocName} design doc update err")

formatDesignDoc = (doc)->
  # Design docs are persisted without their _rev
  doc = _.omit doc, '_rev'
  return JSON.stringify doc, null, 2
