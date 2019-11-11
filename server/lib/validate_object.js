CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'

# Throws if the passed object doesn't respect the provided constraints:
# - validKeys: a limited set of possible keys
# - valuesType: the expected type of values (optional)
module.exports = (obj, validKeys, valuesType)->
  assert_.types [ 'object', 'array' ], [ obj, validKeys ]
  if valuesType? then assert_.string valuesType

  for key, value of obj
    unless key in validKeys
      throw error_.new "invalid object key: #{key}", 500, [ key, obj ]

    if valuesType?
      unless _.typeOf(value) is valuesType
        throw error_.new "invalid object value: #{value}", 500, [ value, obj ]

  return
