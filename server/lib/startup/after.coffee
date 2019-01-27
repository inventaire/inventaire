CONFIG = require 'config'
__ = CONFIG.universalPath
{ noop } = require 'lodash'
fs = require 'fs'

module.exports = ->
  # Provides a way to know when the server
  # started listening by observing file change
  # Expected by scripts/test_api
  # Pass noop as callback to avoid getting a DeprecationWarning
  fs.writeFile "./run/#{CONFIG.port}", process.pid, noop

  if CONFIG.couch2elastic4sync.activated
    # Need to wait for databases to exist
    __.require('scripts', 'couch2elastic4sync/exec')('sync')

  # Run once the databases are ready to prevent having multiple error messages
  # if databases aren't properly setup
  __.require('lib', 'emails/mailer')()
