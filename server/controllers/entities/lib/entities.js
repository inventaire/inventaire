const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const db = __.require('couch', 'base')('entities')
const Entity = __.require('models', 'entity')
const patches_ = require('./patches')
const isbn_ = __.require('lib', 'isbn/isbn')
const couch_ = __.require('lib', 'couch')
const validateAndFormatClaims = require('./validate_and_format_claims')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')
const getEntityType = require('./get_entity_type')
const radio = __.require('lib', 'radio')
const { getUrlFromImageHash } = __.require('lib', 'images')

const { validateProperty } = require('./properties/validations')

const entities_ = module.exports = {
  byId: db.get,

  byIds: db.byIds,

  byIsbns: isbns => {
    const keys = isbns
      .map(isbn => isbn_.toIsbn13(isbn, true))
      .filter(_.identity)
      .map(isbn => [ 'wdt:P212', isbn ])
    return db.viewByKeys('byClaim', keys)
  },

  byIsbn: isbn => {
    return entities_.byIsbns([ isbn ])
    .then(couch_.firstDoc)
  },

  byClaim: async (property, value, includeDocs = false, parseDoc = false) => {
    validateProperty(property)

    const res = await db.view('entities', 'byClaim', {
      key: [ property, value ],
      include_docs: includeDocs
    })

    if (parseDoc) return couch_.mapDoc(res)
    else return res
  },

  urisByClaim: async (property, value) => {
    const entities = await entities_.byClaim(property, value, true, true)
    return entities.map(getInvEntityCanonicalUri)
  },

  byClaimsValue: (value, count) => {
    return db.view('entities', 'byClaimValue', {
      key: value,
      include_docs: false
    })
    .then(res => {
      if (count) return res.rows.length
      return res.rows.map(row => ({
        entity: row.id,
        property: row.value
      }))
    })
  },

  createBlank: () => {
    // Create a new entity doc.
    // This constituts the basis on which next modifications patch
    return db.postAndReturn(Entity.create())
  },

  edit: async params => {
    const { userId, updatedLabels, updatedClaims, currentDoc, batchId } = params
    let updatedDoc = _.cloneDeep(currentDoc)
    updatedDoc = Entity.setLabels(updatedDoc, updatedLabels)
    updatedDoc = Entity.addClaims(updatedDoc, updatedClaims)
    return entities_.putUpdate({ userId, currentDoc, updatedDoc, batchId })
  },

  addClaims: async (userId, newClaims, currentDoc, batchId) => {
    const type = getEntityType(currentDoc.claims['wdt:P31'])
    newClaims = await validateAndFormatClaims({ claims: newClaims, type })
    const updatedDoc = Entity.addClaims(_.cloneDeep(currentDoc), newClaims)
    return entities_.putUpdate({ userId, currentDoc, updatedDoc, batchId })
  },

  putUpdate: async params => {
    const { userId, currentDoc, updatedDoc } = params
    assert_.types([ 'string', 'object', 'object' ], [ userId, currentDoc, updatedDoc ])

    Entity.validateBeforeSave(updatedDoc)

    // It is to the consumers responsability to check if there is an update:
    // empty patches at this stage will throw 500 errors
    const docAfterUpdate = await db.putAndReturn(updatedDoc)
    triggerUpdateEvent(currentDoc, docAfterUpdate)
    await patches_.create(params)
    return docAfterUpdate
  },

  getUrlFromEntityImageHash: getUrlFromImageHash.bind(null, 'entities'),

  firstClaim: (entity, property) => {
    if (entity.claims[property] != null) return entity.claims[property][0]
  },

  uniqByUri: entities => _.uniqBy(entities, getUri)
}

const getUri = entity => entity.uri

const triggerUpdateEvent = (currentDoc, updatedDoc) => {
  // Use currentDoc claims if the update removed the claims object
  // Known case: when an entity is turned into a redirection
  const claims = updatedDoc.claims || currentDoc.claims
  const type = getEntityType(claims['wdt:P31'])
  radio.emit('inv:entity:update', updatedDoc._id, type)
}
