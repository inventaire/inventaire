__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

# Parameters attributes:
# - format (optional)
# - validate (required): throw an custom error or return a boolean
#   for a generalist `invalid #{paramName} error`

validations =
  common: __.require 'models', 'validations/common'
  user: __.require 'models', 'validations/user'

parseNumberString = (value)->
  if _.isNumber value then return value
  return parseFloat value

couchUuid =
  validate: validations.common.couchUuid

strictlyPositiveInteger =
  format: parseNumberString
  validate: (num)-> _.isNumber(num) and /^\d+$/.test(num.toString())

nonEmptyString =
  validate: (value, name, config)->
    unless _.isString value
      message = "invalid #{name}"
      details = "expected string, got #{_.typeOf(value)}"
      throw error_.new "invalid #{name}: #{details}", 400, { value }

    if config.length and value.length isnt config.length
      message = "invalid #{name} length"
      details = "expected #{config.length}, got #{value.length}"
      throw error_.new "#{message}: #{details}", 400, { value }

    return true

module.exports =
  email: { validate: validations.common.email }
  limit: strictlyPositiveInteger
  offset: strictlyPositiveInteger
  password:
    secret: true
    validate: validations.user.password
  token: nonEmptyString
  user: couchUuid
  username: { validate: validations.common.username }
