CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
sanitize = __.require 'lib', 'sanitize/sanitize'
sanitizeEntry = require './lib/resolver/sanitize_entry'
resolve = require './lib/resolver/resolve'
createUnresolvedEntry = require './lib/resolver/create_unresolved_entry'
updateResolvedEntry = require './lib/resolver/update_resolved_entry'

sanitization =
  entries:
    generic: 'collection'
  create:
    generic: 'boolean'
    optional: true
  update:
    generic: 'boolean'
    optional: true

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    batchId = Date.now()
    resolvedEntries = []
    Promise.all params.entries.map(sanitizeEntry(res))
    .then (entries)-> sequentialResolve(entries, resolvedEntries, batchId, params)
  .then responses_.Wrap(res, 'results')
  .catch error_.Handler(req, res)

sequentialResolve = (entries, resolvedEntries, batchId, params)->
  { create, update, reqUserId } = params
  nextEntry = entries.shift()
  unless nextEntry? then return resolvedEntries

  resolve nextEntry
  .then updateResolvedEntry(update, reqUserId, batchId)
  .then createUnresolvedEntry(create, reqUserId, batchId)
  .then (entry)-> resolvedEntries.push entry
  .then -> sequentialResolve entries, resolvedEntries, batchId, params
