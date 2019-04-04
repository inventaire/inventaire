CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
sanitize = __.require 'lib', 'sanitize/sanitize'
sanitizeEntry = require './lib/resolver/sanitize_entry'
resolve = require './lib/resolver/resolve'
UpdateResolvedEntry = require './lib/resolver/update_resolved_entry'
CreateUnresolvedEntry = require './lib/resolver/create_unresolved_entry'

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
    params.batchId = Date.now()
    resolvedEntries = []
    entries = params.entries.map(sanitizeEntry(res))
    sequentialResolve entries, buildUpdateFn(params), buildCreateFn(params), resolvedEntries
  .then responses_.Wrap(res, 'entries')
  .catch error_.Handler(req, res)

sequentialResolve = (entries, updateResolvedEntry, createUnresolvedEntry, resolvedEntries)->
  nextEntry = entries.shift()
  unless nextEntry? then return resolvedEntries

  resolve nextEntry
  .then updateResolvedEntry
  .then createUnresolvedEntry
  .then (entry)-> resolvedEntries.push entry
  .then -> sequentialResolve entries, updateResolvedEntry, createUnresolvedEntry, resolvedEntries

buildUpdateFn = (params)->
  { update, reqUserId, batchId } = params
  if update then UpdateResolvedEntry reqUserId, batchId else _.identity

buildCreateFn = (params)->
  { create, reqUserId, batchId } = params
  if create then CreateUnresolvedEntry reqUserId, batchId else _.identity
