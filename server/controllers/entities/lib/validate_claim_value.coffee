__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'

{ properties, testDataType } = require './properties'

module.exports = (db)->
  validateClaimValue = (currentClaims, property, oldVal, newVal, letEmptyValuePass)->
    # letEmptyValuePass to let it be interpreted as a claim deletion
    if letEmptyValuePass and not newVal? then return promises_.resolve null

    prop = properties[property]

    unless prop.test newVal
      return error_.reject 'invalid property value', 400, property, newVal

    unless testDataType property, newVal
      return error_.reject 'invalid value datatype', 400, property, newVal

    # if the property expects a uniqueValue and that there is already a value defined
    # any action other than editing the current value should be rejected
    if prop.uniqueValue
      propArray = currentClaims[property]
      if propArray?.length > 0 and oldVal isnt propArray[0]
        return error_.reject 'this property accepts only one value', 400, arguments

    formattedValue = prop.format newVal

    unless prop.concurrency then return promises_.resolve formattedValue

    verifyExisting property, formattedValue
    .then -> formattedValue

  verifyExisting = (property, value)->
    # using viewCustom as there is no need to include docs
    db.viewCustom 'byClaim', { key: [property, value] }
    .then (docs)->
      if docs.length isnt 0
        message = "this property value already exist: #{property} -> #{value}"
        throw error_.new message, 400, property, value


  return validateClaimValue
