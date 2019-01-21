CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
isbn_ = __.require 'lib', 'isbn/isbn'
{ concurrentString } = require './properties_config_bases'

module.exports =
  isbnProperty: (num)->
    _.extend {}, concurrentString,
      validate: (isbn)-> isbn? and isbn is isbn_.parse(isbn)?["isbn#{num}h"]
      uniqueValue: true
      format: isbn_["toIsbn#{num}h"]
      adminUpdateOnly: true

  # External ids regexs can be found
  # on their Wikidata property page P1793 statement
  externalId: (regex)->
    _.extend {}, concurrentString,
      validate: regex.test.bind regex
      isExternalId: true
