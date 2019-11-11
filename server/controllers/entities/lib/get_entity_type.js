__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ types } =  __.require 'lib', 'wikidata/aliases'

# Takes an entity wdt:P31 (instance of) claims array
# Returns a entity type string: work, edition, article, human, genre
# If no type is found, try with the wdt:P279 (subclass of) claims array
# (used for Wikidata entities only, as all inv entities have a known P31)
module.exports = (wdtP31Array, wdtP279Array)->
  unless wdtP31Array? then return

  for value in wdtP31Array
    type = types[value]
    # return as soon as we get a type
    if type? then return type

  unless wdtP279Array? then return

  for value in wdtP279Array
    type = types[value]
    # return as soon as we get a type
    if type? then return type

  return
