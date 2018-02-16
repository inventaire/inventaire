CONFIG = require('config')
__ = CONFIG.universalPath
promises_ = __.require 'lib', 'promises'
{ buildSearcher } = __.require 'lib', 'elasticsearch'

index = 'wikidata'

queryBodyBuilder = (title)->
  { size: 20, query: { bool: { should: [ { match: { _all: title } } ] } } }
