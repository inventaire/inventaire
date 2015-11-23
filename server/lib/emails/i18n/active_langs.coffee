CONFIG = require 'config'
__ = CONFIG.universalPath
activeFiles  = __.require 'client', 'scripts/lib/active_files'

# Email translation source files are mixed with other files in the src folder,
# thus the need to filter
langJsonOnly = (file)-> /^\w{2}\.json$/.test file
emailsActiveLangs = activeFiles './server/lib/emails/i18n/src', langJsonOnly

module.exports = emailsActiveLangs
