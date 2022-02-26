const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const db = require('db/couchdb/base')('entities')
const Entity = require('models/entity')
const isbn_ = require('lib/isbn/isbn')
const couch_ = require('lib/couch')
const validateAndFormatClaims = require('./validate_and_format_claims')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')
const getEntityType = require('./get_entity_type')
const { getUrlFromImageHash } = require('lib/images')
const { emit } = require('lib/radio')

const { validateProperty } = require('./properties/validations')
const createPatch = require('./patches/create_patch')

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

  edit: async params => {
    const { userId, updatedLabels, updatedClaims, currentDoc, batchId, create } = params
    let updatedDoc = _.cloneDeep(currentDoc)
    updatedDoc = Entity.setLabels(updatedDoc, updatedLabels)
    updatedDoc = Entity.addClaims(updatedDoc, updatedClaims)
    return entities_.putUpdate({ userId, currentDoc, updatedDoc, batchId, create })
  },

  addClaims: async (userId, newClaims, currentDoc, batchId) => {
    const type = getEntityType(currentDoc.claims['wdt:P31'])
    newClaims = await validateAndFormatClaims({ claims: newClaims, type })
    const updatedDoc = Entity.addClaims(_.cloneDeep(currentDoc), newClaims)
    return entities_.putUpdate({ userId, currentDoc, updatedDoc, batchId })
  },

  putUpdate: async params => {
    const { userId, currentDoc, updatedDoc, create } = params
    assert_.types([ 'string', 'object', 'object' ], [ userId, currentDoc, updatedDoc ])

    Entity.beforeSave(updatedDoc)

    // It is to the consumers responsability to check if there is an update:
    // empty patches at this stage will throw 500 errors
    let docAfterUpdate
    if (create) {
      docAfterUpdate = await db.postAndReturn(updatedDoc)
    } else {
      docAfterUpdate = await db.putAndReturn(updatedDoc)
    }

    try {
      const patch = await createPatch(params)
      if (patch) await emit('patch:created', patch)
    } catch (err) {
      err.type = 'patch_creation_failed'
      err.context = err.context || {}
      err.context.data = { currentDoc, updatedDoc }
      throw err
    }

    return docAfterUpdate
  },

  getUrlFromEntityImageHash: getUrlFromImageHash.bind(null, 'entities'),

  firstClaim: (entity, property) => {
    if (entity.claims[property] != null) return entity.claims[property][0]
  },

  uniqByUri: entities => _.uniqBy(entities, getUri),

  imageIsUsed: async imageHash => {
    assert_.string(imageHash)
    const { rows } = await entities_.byClaim('invp:P2', imageHash)
    return rows.length > 0
  }
}

const getUri = entity => entity.uri
