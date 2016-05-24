__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (err, filter, contextArray)->
  # numbers filters are used as HTTP codes
  # while string will be taken as a type
  attribute = if _.isNumber(filter) then 'status' else 'type'
  err[attribute] = filter

  # prevent having an array in an array as context
  if contextArray.length is 1 and _.isArrayLike contextArray[0]
    # convert arguments objects to array
    contextArray = _.toArray contextArray[0]

  err.context = contextArray
  err.emitter = getErrorEmittingLines err
  return err

getErrorEmittingLines = (err)->
  err.stack.split('\n')[2..4]
  .map getErrorEmittingLine

getErrorEmittingLine = (line)->
  line?.trim()
  .replace 'at ', ''
  # delete parenthesis around the file path
  .replace /(\(|\))/g, ''
  # delete machine specific path
  .replace /[a-z_\/]+server/, ': server'
  .replace /[a-z_\/]+node_modules/, ': node_modules'
  # identify anonymous functions
  .replace /^:/, '(anonymous):'
