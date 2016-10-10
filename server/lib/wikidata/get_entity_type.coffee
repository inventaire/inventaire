__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ types } = require './aliases'

# Takes an entity P31 claims array
# Returns a entity type string: book, edition, article, human, genre
module.exports = (P31Array)->
  unless P31Array? then return typeNotFound P31Array

  for value in P31Array
    type = types[value]
    # return as soon as we get a type
    if type? then return type

  typeNotFound P31Array

typeNotFound = (P31Array)->
  _.warn P31Array, 'type not found'
  return
