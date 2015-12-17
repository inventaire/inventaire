CONFIG = require 'config'
__ = CONFIG.universalPath
activeFiles  = __.require 'client', 'scripts/lib/active_files'

# Email translation source files are mixed with other files in the src folder,
# thus the need to filter
langJsonOnly = (file)-> /^\w{2}\.json$/.test file

i18nSrcPath = __.path 'i18nSrc'
emailsActiveLangs = activeFiles i18nSrcPath, langJsonOnly

module.exports = emailsActiveLangs
