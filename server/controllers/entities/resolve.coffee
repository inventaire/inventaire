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
    entries = params.entries.map(sanitizeEntry)
    return sequentialResolve entries, params
  .then responses_.Wrap(res, 'entries')
  .catch error_.Handler(req, res)

sequentialResolve = (entries, params)->
  { create, update } = params
  updateResolvedEntry = buildActionFn update, UpdateResolvedEntry, params
  createUnresolvedEntry = buildActionFn create, CreateUnresolvedEntry, params
  resolvedEntries = []

  resolveNext = ->
    nextEntry = entries.shift()
    unless nextEntry? then return resolvedEntries

    resolve nextEntry
    .then updateResolvedEntry
    .then createUnresolvedEntry
    .then (entry)-> resolvedEntries.push entry
    .then resolveNext

  return resolveNext()

buildActionFn = (flag, ActionFn, params)->
  { reqUserId, batchId } = params
  if flag then ActionFn reqUserId, batchId
  else _.identity
