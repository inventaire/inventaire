__ = require('config').universalPath
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('entities')
promises_ = __.require 'lib', 'promises'
Entity = __.require 'models', 'entity'
patches_ = require './patches'
isbn_ = __.require 'lib', 'isbn/isbn'
couch_ = __.require 'lib', 'couch'
validateClaimValue = require('./validate_claim_value')(db)

{ validateProperty } = require './properties'

module.exports = entities_ =
  db: db
  byId: db.get.bind(db)

  byIds: (ids)->
    ids = _.forceArray ids
    db.fetch ids
    .then _.compact

  byIsbns: (isbns)->
    keys = isbns
      .map (isbn)-> isbn_.toIsbn13 isbn, true
      .filter _.identity
      .map (isbn)-> ['wdt:P212', isbn]
    db.viewByKeys 'byClaim', keys

  byWikidataIds: (ids)->
    keys = ids.map (id)-> ['invp:P1', id]
    db.viewByKeys 'byClaim', keys

  byClaim: (property, value, includeDocs=false)->
    promises_.try -> validateProperty property
    .then ->
      db.view 'entities', 'byClaim',
        key: [ property, value ]
        include_docs: includeDocs

  idsByClaim: (property, value)->
    entities_.byClaim property, value
    .then couch_.mapId

  create: ->
    # Create a new entity doc.
    # This constituts the basis on which next modifications patch
    db.postAndReturn Entity.create()
    .then _.Log('created doc')

  edit: (userId, updatedLabels, updatedClaims, currentDoc)->
    updatedDoc = _.cloneDeep currentDoc
    promises_.try ->
      updatedDoc = Entity.setLabels updatedDoc, updatedLabels
      return Entity.addClaims updatedDoc, updatedClaims
    .then db.putAndReturn
    .tap -> patches_.create userId, currentDoc, updatedDoc

  updateLabel: (lang, value, userId, currentDoc)->
    updatedDoc = _.cloneDeep currentDoc
    updatedDoc = Entity.setLabel updatedDoc, lang, value
    return putUpdate userId, currentDoc, updatedDoc

  updateClaim: (property, oldVal, newVal, userId, currentDoc)->
    updatedDoc = _.cloneDeep currentDoc
    { claims } = currentDoc
    entities_.validateClaim claims, property, oldVal, newVal, true
    .then (formattedValue)->
      Entity.updateClaim updatedDoc, property, oldVal, formattedValue
    .then putUpdate.bind(null, userId, currentDoc)

  validateClaim: (claims, property, oldVal, newVal, letEmptyValuePass)->
    promises_.try -> validateProperty property
    .then -> validateClaimValue claims, property, oldVal, newVal, letEmptyValuePass

putUpdate = (userId, currentDoc, updatedDoc)->
  _.log currentDoc, 'current doc'
  _.log updatedDoc, 'updated doc'
  _.types arguments, ['string', 'object', 'object']
  db.putAndReturn updatedDoc
  .tap -> patches_.create userId, currentDoc, updatedDoc
