__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'

{ properties, testDataType, propertyDatatypePrimordialType } = require './properties'

module.exports = (db)->
  validateClaimValue = (params)->
    { currentClaims, property, oldVal, newVal, letEmptyValuePass, userIsAdmin } = params
    # letEmptyValuePass to let it be interpreted as a claim deletion
    if letEmptyValuePass and not newVal? then return promises_.resolve null

    prop = properties[property]

    # If no old value is passed, it's a claim creation, not an update
    updatingValue = oldVal?

    # Ex: a user can freely set a wdt:P31 value, but only an admin can change it
    if updatingValue and prop.adminUpdateOnly and not userIsAdmin
      return error_.reject "updating property requires admin's rights", 403, property, newVal

    unless prop.test newVal
      return error_.reject 'invalid property value', 400, property, newVal

    unless testDataType property, newVal
      expectedDatatype = propertyDatatypePrimordialType property
      realDatatype = _.typeOf newVal
      context = "expected #{expectedDatatype}, got #{realDatatype}"
      return error_.reject "invalid value datatype: #{context}", 400, property, newVal

    # If the property expects a uniqueValue and that there is already a value defined
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
      if docs.length > 0
        # /!\ The client rely on this exact message
        # client/app/modules/entities/lib/creation_partials.coffee
        message = 'this property value is already used'
        throw error_.new message, 400, property, value

  return validateClaimValue
