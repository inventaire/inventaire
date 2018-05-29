__ = require('config').universalPath
_ = __.require 'builders', 'utils'
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

module.exports =
  email: { validate: validations.common.email }
  limit: strictlyPositiveInteger
  offset: strictlyPositiveInteger
  password:
    secret: true
    validate: validations.user.password
  user: couchUuid
  username: { validate: validations.common.username }
