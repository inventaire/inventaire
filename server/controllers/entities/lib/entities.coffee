__ = require('config').universalPath
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('entities')
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Entity = __.require 'models', 'entity'
patches_ = require './patches'
books_ = __.require 'lib', 'books'

{ properties, validateProperty, testDataType } = require './properties'

module.exports =
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

  create: (entityData, userId)->
    # create new entity doc
    db.postAndReturn Entity.create(entityData)
    .tap _.Log('created doc')
    # then create the associated patch
    .tap patches_.create.bind(null, userId, {})

  createClaim: (doc, property, value, userId)->
    promises_.try -> validateProperty property
    .then -> validateValue property, value
    .then (formattedValue)-> Entity.createClaim(doc, property, formattedValue)
    .tap _.Log('updated doc')
    .tap db.putAndReturn
    .tap patches_.create.bind(null, userId, doc)


validateValue = (property, value)->
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
