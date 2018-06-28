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
  parsedValue = parseFloat value
  return if _.isNaN parsedValue then value else parsedValue

couchUuid =
  validate: validations.common.couchUuid
  rename: (name)-> "#{name}Id"

positiveInteger =
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

arrayOfAKind = (validation)-> (values, kind)->
  unless _.isArray values
    details = "expected array, got #{_.typeOf(values)}"
    throw error_.new "invalid #{kind}: #{details}", 400, { values }

  for value in values
    unless validation value
      # approximative way to get singular of a word
      singularKind = kind.replace /s$/, ''
      details = "expected #{singularKind}, got #{value} (#{_.typeOf(values)})"
      throw error_.new "invalid #{singularKind}: #{details}", 400, { values }

  return true

arrayOrPipedStrings = (value)->
  if _.isString value then return value.split '|'
  return value

entityUris =
  format: arrayOrPipedStrings
  validate: arrayOfAKind validations.common.entityUri

couchUuids =
  format: arrayOrPipedStrings
  validate: arrayOfAKind validations.common.couchUuid

whitelistedString =
  validate: (value, name, config)->
    if value in config.whitelist
      return true
    else
      details = "possible values: #{config.whitelist.join(', ')}"
      throw error_.new "invalid #{name}: #{value} (#{details})", 400, { value }

whitelistedStrings =
  format: arrayOrPipedStrings
  validate: (values, name, config)->
    for value in values
      whitelistedString.validate(value, name, config)
    return true

generics =
  boolean:
    format: (value, name, config)->
      if _.isString value then _.parseBooleanString value, config.default
      else value
    validate: (value)-> _.typeOf(value) is 'boolean'

module.exports =
  email: { validate: validations.common.email }
  generics: generics
  refresh: generics.boolean
  filter: whitelistedString
  ids: couchUuids
  item: couchUuid
  lang:
    default: 'en'
    validate: _.isLang
  limit: _.extend {}, positiveInteger,
    min: 1
    default: 100
  message: nonEmptyString
  offset: _.extend {}, positiveInteger, { default: 0 }
  password:
    secret: true
    validate: validations.user.password
  range: _.extend {}, positiveInteger,
    default: 50
    max: 500
  token: nonEmptyString
  uri: { validate: validations.common.entityUri }
  uris: entityUris
  user: couchUuid
  users: couchUuids
  username: { validate: validations.common.username }
  relatives: whitelistedStrings
