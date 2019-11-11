CONFIG = require 'config'
__ = CONFIG.universalPath
fs = require 'fs'

module.exports = ->
  if CONFIG.couch2elastic4sync.activated
    # Need to wait for databases to exist
    __.require('scripts', 'couch2elastic4sync/exec')('sync')

  # Run once the databases are ready to prevent having multiple error messages
  # if databases aren't properly setup
  __.require('lib', 'emails/mailer')()
