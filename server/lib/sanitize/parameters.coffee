__ = require('config').universalPath
_ = __.require 'builders', 'utils'
commonValidations = __.require 'models', 'validations/common'

parseNumberString = (value)->
  if _.isNumber value then return value
  return parseFloat value

couchUuid =
  validate: commonValidations.couchUuid

strictlyPositiveInteger =
  format: parseNumberString
  validate: (num)-> _.isNumber(num) and /^\d+$/.test(num.toString())

module.exports =
  user: couchUuid
  limit: strictlyPositiveInteger
  offset: strictlyPositiveInteger
