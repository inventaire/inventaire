import _ from '#builders/utils'
import assert_ from '#lib/utils/assert_types'
import error_ from '#lib/error/error'
import dbFactory from '#db/couchdb/base'
import Entity from '#models/entity'
import isbn_ from '#lib/isbn/isbn'
import couch_ from '#lib/couch'
import { getUrlFromImageHash } from '#lib/images'
import { emit } from '#lib/radio'
import validateAndFormatClaims from './validate_and_format_claims.js'
import getInvEntityCanonicalUri from './get_inv_entity_canonical_uri.js'
import getEntityType from './get_entity_type.js'
import { validateProperty } from './properties/validations.js'
import createPatch from './patches/create_patch.js'

const db = dbFactory('entities')

const entities_ = {
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
      const patchErr = error_.new('patch creation failed', 500, { currentDoc, updatedDoc })
      patchErr.name = 'patch_creation_failed'
      patchErr.cause = err
      throw patchErr
    }

    return docAfterUpdate
  },

  getUrlFromEntityImageHash: getUrlFromImageHash.bind(null, 'entities'),

  uniqByUri: entities => _.uniqBy(entities, getUri),

  imageIsUsed: async imageHash => {
    assert_.string(imageHash)
    const { rows } = await entities_.byClaim('invp:P2', imageHash)
    return rows.length > 0
  }
}

export default entities_

const getUri = entity => entity.uri

const firstClaim = entities_.firstClaim = (entity, property) => {
  if (entity.claims[property] != null) return entity.claims[property][0]
}

entities_.setTermsFromClaims = entity => {
  const title = firstClaim(entity, 'wdt:P1476')
  const subtitle = firstClaim(entity, 'wdt:P1680')
  if (title) {
    entity.labels = entity.labels || {}
    entity.labels.fromclaims = title
  }
  if (subtitle) {
    entity.descriptions = entity.descriptions || {}
    entity.descriptions.fromclaims = subtitle
  }
}
