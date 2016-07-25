CONFIG = require 'config'
__ = CONFIG.universalPath
isbn2 = require('isbn2').ISBN

# Inferences are property values deduced from another property
module.exports =
  'wdt:P212':
    'wdt:P957': (isbn13)-> isbn2.parse(isbn13)?.codes.isbn10h
