__ = require('config').universalPath
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('entities')
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Entity = __.require 'models', 'entity'
patches_ = require './patches'
books_ = __.require 'lib', 'books'

{ properties, validateProperty, testDataType } = require './properties'

module.exports = entities_ =
  db: db
  byId: db.get.bind(db)

  byIds: (ids)->
    ids = _.forceArray ids
    db.fetch ids
    .then _.compact
    .then _.Log('getEntities')

  byIsbn: (isbn)->
    isbn = books_.normalizeIsbn isbn
    P = if isbn.length is 13 then 'P212' else 'P957'
    db.viewFindOneByKey 'byClaim', [P, isbn]

  create: ->
    # Create a new entity doc.
    # This constituts the basis on which next modifications patch
    db.postAndReturn Entity.create()
    .then _.Log('created doc')

  edit: (userId, updatedLabels, updatedClaims, currentDoc)->
    updatedDoc = _.cloneDeep currentDoc
    updatedDoc = Entity.addLabels updatedDoc, updatedLabels
    updatedDoc = Entity.addClaims updatedDoc, updatedClaims
    db.putAndReturn updatedDoc
    .tap -> patches_.create userId, currentDoc, updatedDoc

  updateClaim: (property, oldVal, newVal, userId, doc)->
    entities_.validateClaim property, newVal, true
    .then (formattedValue)->
      Entity.updateClaim doc, property, oldVal, formattedValue
    .then putUpdate.bind(null, userId, doc)

  validateClaim: (property, value, letEmptyValuePass)->
    promises_.try -> validateProperty property
    .then -> validateClaimValue property, value, letEmptyValuePass

putUpdate = (userId, currentDoc, updatedDoc)->
  _.log updatedDoc, 'updated doc'
  _.types arguments, ['string', 'object', 'object']
  db.putAndReturn updatedDoc
  .tap -> patches_.create userId, currentDoc, updatedDoc

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
