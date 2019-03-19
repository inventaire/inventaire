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

whitelistedOptions = [ 'create', 'update' ]

sanitization =
  entries:
    generic: 'collection'
  create:
    generic: 'boolean'
    optional: true
  update:
    generic: 'boolean'
    optional: true
  summary:
    generic: 'object'
    optional: true

module.exports = (req, res)->
  { create, update, summary } = req.body
  reqUserId = req.user._id
  sanitize req, res, sanitization
  .get 'entries'
  .then (entries)-> Promise.all entries.map(sanitizeEntry(res))
  .then (entries)-> sequentialResolve(entries, result = [])(create, update, reqUserId, summary)
  .then responses_.Wrap(res, 'results')
  .catch error_.Handler(req, res)

sequentialResolve = (entries, result)-> (create, update, reqUserId, summary)->
  nextEntry = entries.shift()
  unless nextEntry? then return result
  resolve(reqUserId)(nextEntry)
  .then updateResolvedEntry(update, reqUserId, summary)
  .then createUnresolvedEntry(create, reqUserId, summary)
  .then (entry)-> result.push entry
  .then sequentialResolve(entries, result)
