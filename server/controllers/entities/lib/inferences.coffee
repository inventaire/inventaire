CONFIG = require 'config'
__ = CONFIG.universalPath
isbn_ = __.require 'lib', 'isbn/isbn'

# Inferences are property values deduced from another property
module.exports =
  'wdt:P212':
    'wdt:P957': (isbn13)-> isbn_.parse(isbn13)?.isbn10h
    'wdt:P407': (isbn13)-> isbn_.parse(isbn13)?.groupLangUri
