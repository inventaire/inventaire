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

whitelistedOptions = [ 'create', 'update' ]

sanitization =
  entries:
    generic: 'collection'
  options:
    whitelist: whitelistedOptions
    optional: true

module.exports = (req, res)->
  { options } = req.body
  reqUserId = req.user._id
  sanitize req, res, sanitization
  .get 'entries'
  .then (entries)-> Promise.all entries.map(sanitizeEntry(res))
  .then (entries)-> sequentialResolve(entries, result = [])(options, reqUserId)
  .then responses_.Wrap(res, 'result')
  .catch error_.Handler(req, res)

sequentialResolve = (entries, result)-> (options, reqUserId)->
  nextEntry = entries.shift()
  unless nextEntry? then return result
  resolve(reqUserId)(nextEntry)
  .then createUnresolvedEntry(options, reqUserId)
  .then (entry)-> result.push entry
  .then sequentialResolve(entries, result)


