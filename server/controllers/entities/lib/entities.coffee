__ = require('config').universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
db = __.require('couch', 'base')('entities')
promises_ = __.require 'lib', 'promises'
Entity = __.require 'models', 'entity'
patches_ = require './patches'
isbn_ = __.require 'lib', 'isbn/isbn'
couch_ = __.require 'lib', 'couch'
validateClaimValue = require './validate_claim_value'
getInvEntityCanonicalUri = require './get_inv_entity_canonical_uri'
getEntityType = require './get_entity_type'
radio = __.require 'lib', 'radio'
{ getUrlFromImageHash } = __.require 'lib', 'images'

{ validateProperty } = require './properties/validations'

module.exports = entities_ =
  db: db
  byId: db.get

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

  byIsbn: (isbn)->
    entities_.byIsbns [ isbn ]
    .then couch_.firstDoc

  byClaim: (property, value, includeDocs = false, parseDoc = false)->
    promises_.try -> validateProperty property
    .then ->
      query = db.view 'entities', 'byClaim',
        key: [ property, value ]
        include_docs: includeDocs
      if parseDoc then query.then couch_.mapDoc
      else query

  urisByClaim: (property, value)->
    entities_.byClaim property, value, true, true
    .map (doc)-> getInvEntityCanonicalUri(doc)[0]

  byClaimsValue: (value, count)->
    db.view 'entities', 'byClaimValue',
      key: value
      include_docs: false
    .then (res)->
      if count then return res.rows.length
      res.rows.map (row)->
        entity: row.id
        property: row.value

  create: ->
    # Create a new entity doc.
    # This constituts the basis on which next modifications patch
    db.postAndReturn Entity.create()

  edit: (params)->
    { userId, updatedLabels, updatedClaims, currentDoc, batchId } = params
    updatedDoc = _.cloneDeep currentDoc
    promises_.try ->
      updatedDoc = Entity.setLabels updatedDoc, updatedLabels
      return Entity.addClaims updatedDoc, updatedClaims
    .then (updatedDoc)->
      entities_.putUpdate { userId, currentDoc, updatedDoc, batchId }

  addClaims: (userId, updatedClaims, currentDoc, batchId)->
    updatedDoc = _.cloneDeep currentDoc
    promises_.try -> Entity.addClaims updatedDoc, updatedClaims
    .then -> entities_.putUpdate { userId, currentDoc, updatedDoc, batchId }

  validateClaim: (params)->
    { property } = params
    promises_.try -> validateProperty property
    .then -> validateClaimValue params

  getLastChangedEntitiesUris: (since, limit)->
    db.changes
      filter: 'entities/entities:only'
      limit: limit
      since: since
      include_docs: true
      descending: true
    .then (res)->
      # TODO: return URIs in no-redirect mode so that redirections appear in entity changes
      uris: res.results.map parseCanonicalUri
      lastSeq: res.last_seq

  putUpdate: (params)->
    { userId, currentDoc, updatedDoc } = params
    assert_.types [ 'string', 'object', 'object' ], [ userId, currentDoc, updatedDoc ]
    # It is to the consumers responsability to check if there is an update:
    # empty patches at this stage will throw 500 errors
    db.putAndReturn updatedDoc
    .tap ->
      triggerUpdateEvent currentDoc, updatedDoc
      patches_.create params

  getUrlFromEntityImageHash: getUrlFromImageHash.bind null, 'entities'

parseCanonicalUri = (result)-> getInvEntityCanonicalUri(result.doc)[0]

triggerUpdateEvent = (currentDoc, updatedDoc)->
  # Use currentDoc claims if the update removed the claims object
  # Known case: when an entity is turned into a redirection
  claims = updatedDoc.claims or currentDoc.claims
  type = getEntityType claims['wdt:P31']
  radio.emit 'inv:entity:update', updatedDoc._id, type
