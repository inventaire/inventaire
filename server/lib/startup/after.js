// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath

module.exports = () => {
  if (CONFIG.couch2elastic4sync.activated) {
    // Need to wait for databases to exist
    __.require('scripts', 'couch2elastic4sync/exec')('sync')
  }

  // Run once the databases are ready to prevent having multiple error messages
  // if databases aren't properly setup
  return __.require('lib', 'emails/mailer')()
}
