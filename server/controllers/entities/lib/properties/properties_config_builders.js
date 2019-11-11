CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
isbn_ = __.require 'lib', 'isbn/isbn'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
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

  typedExternalId: (regexPerType)->
    _.extend {}, concurrentString,
      typeSpecificValidation: true
      isExternalId: true
      validate: (value, entityType)->
        assert_.string entityType
        unless regexPerType[entityType]?
          throw error_.new 'unsupported type', 500, { regexPerType, entityType, value }
        return regexPerType[entityType].test value
