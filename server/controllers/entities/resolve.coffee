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
{ oneHour } =  __.require 'lib', 'times'

sanitization =
  entries:
    generic: 'collection'
  create:
    generic: 'boolean'
    optional: true
  update:
    generic: 'boolean'
    optional: true
  strict:
    generic: 'boolean'
    optional: true
    default: true

module.exports = (req, res)->
  req.setTimeout oneHour

  sanitize req, res, sanitization
  .then (params)->
    params.batchId = Date.now()
    { strict } = params
    { entries, errors } = sanitizeEntries params.entries, strict

    return sequentialResolve entries, params
    .then (resolvedEntries)->
      data = { entries: resolvedEntries }
      unless strict then data.errors = errors.map formatError
      responses_.send res, data

  .catch error_.Handler(req, res)

sanitizeEntries = (entries, strict)->
  errors = []
  sanitizedEntries = []
  entries.forEach sanitizeEntryAndDispatch(sanitizedEntries, errors, strict)
  return { entries: sanitizedEntries, errors }

sanitizeEntryAndDispatch = (sanitizedEntries, errors, strict)-> (entry)->
  try sanitizedEntries.push sanitizeEntry(entry)
  catch err
    if strict then throw err
    else
      err.entry = entry
      errors.push err
  return

sequentialResolve = (entries, params)->
  if entries.length is 0 then return Promise.resolve []

  { create, update, strict } = params
  updateResolvedEntry = buildActionFn update, UpdateResolvedEntry, params
  createUnresolvedEntry = buildActionFn create, CreateUnresolvedEntry, params
  resolvedEntries = []

  resolveNext = ->
    nextEntry = entries.shift()
    unless nextEntry? then return resolvedEntries

    _.log nextEntry, 'nextEntry'

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

formatError = (err)->
  message: err.message
  entry: err.entry
