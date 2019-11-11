/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const fs = require('fs');

module.exports = function() {
  if (CONFIG.couch2elastic4sync.activated) {
    // Need to wait for databases to exist
    __.require('scripts', 'couch2elastic4sync/exec')('sync');
  }

  // Run once the databases are ready to prevent having multiple error messages
  // if databases aren't properly setup
  return __.require('lib', 'emails/mailer')();
};
