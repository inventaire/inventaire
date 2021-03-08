const CONFIG = require('config')
const __ = CONFIG.universalPath

module.exports = () => {
  // Run once the databases are ready to prevent having multiple error messages
  // if databases aren't properly setup
  require('lib/emails/mailer')()
}
