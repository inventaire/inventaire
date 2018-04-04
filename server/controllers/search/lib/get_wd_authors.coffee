CONFIG = require('config')
__ = CONFIG.universalPath
promises_ = __.require 'lib', 'promises'
{ buildSearcher } = __.require 'lib', 'elasticsearch'

index = 'wikidata'

queryBodyBuilder = (title)->
  query:
    bool:
      should: [
        {
        # boost policy : 'Aaron Swartz' > ( 'Aaron' AND 'Swartz' )
        # type 'phrase' == exact match of full query aka 'Aaron Swartz'
        multi_match:
          query: title
          type: 'phrase'
          fields: [ 'labels.*' ]
          boost: 5
        },
        {
        # operator AND == can match 'Aaron Michael Swartz'
        multi_match:
          query: title
          fields: [ 'labels.*', 'aliases.*' ]
          operator: 'and'
          boost: 2
        }
      ]

module.exports = buildSearcher { index, queryBodyBuilder }
