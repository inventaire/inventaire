__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ types } =  __.require 'lib', 'wikidata/aliases'

# Takes an entity wdt:P31 claims array
# Returns a entity type string: work, edition, article, human, genre
module.exports = (wdtP31Array)->
  unless wdtP31Array? then return

  for value in wdtP31Array
    type = types[value]
    # return as soon as we get a type
    if type? then return type

  return
