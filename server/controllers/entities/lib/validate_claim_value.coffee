__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'

{ properties, testDataType } = require './properties'

module.exports = (db)->
  validateClaimValue = (property, value, letEmptyValuePass)->
    # letEmptyValuePass to let it be interpreted as a claim deletion
    if letEmptyValuePass and not value? then return null

    unless testDataType property, value
      return error_.reject 'invalid value datatype', 400, property, value

    prop = properties[property]
    unless prop.test value
      return error_.reject 'invalid property value', 400, property, value

    formattedValue = prop.format value

    unless prop.concurrency then return promises_.resolve formattedValue

    verifyExisting property, formattedValue
    .then -> formattedValue

  verifyExisting = (property, value)->
    # using viewCustom as there is no need to include docs
    db.viewCustom 'byClaim', { key: [property, value] }
    .then (docs)->
      if docs.length isnt 0
        throw error_.new 'this property value already exist', 400, property, value


  return validateClaimValue
