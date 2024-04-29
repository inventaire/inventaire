import { uniqBy, cloneDeep, identity, pick, uniq } from 'lodash-es'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import dbFactory from '#db/couchdb/base'
import { firstDoc, mapDoc } from '#lib/couch'
import { newError } from '#lib/error/error'
import { getUrlFromImageHash } from '#lib/images'
import { toIsbn13h } from '#lib/isbn/isbn'
import { emit } from '#lib/radio'
import { assert_ } from '#lib/utils/assert_types'
import { addEntityDocClaims, beforeEntityDocSave, setEntityDocLabels } from '#models/entity'
import type { EntityUri, InvEntityDoc, EntityValue, PropertyUri, InvEntity } from '#types/entity'
import getInvEntityCanonicalUri from './get_inv_entity_canonical_uri.js'
import createPatch from './patches/create_patch.js'
import { validateProperty } from './properties/validations.js'

const db = await dbFactory('entities')

export const getEntityById = db.get<InvEntityDoc>
export const getEntitiesByIds = db.byIds<InvEntityDoc>

export function getInvEntitiesByIsbns (isbns) {
  const keys = isbns
    .map(toIsbn13h)
    .filter(identity)
    .map(isbn => [ 'wdt:P212', isbn ])
  return db.getDocsByViewKeys<InvEntity>('byClaim', keys)
}

export const getInvEntityByIsbn = isbn => getInvEntitiesByIsbns([ isbn ]).then(firstDoc)

export async function getInvEntitiesByClaim (property, value, includeDocs = false, parseDoc = false) {
  validateProperty(property)

  const res = await db.view<EntityValue, InvEntity>('entities', 'byClaim', {
    key: [ property, value ],
    include_docs: includeDocs,
  })

  if (parseDoc) return mapDoc(res)
  else return res
}

export async function getInvEntitiesByClaims ({ claims, includeDocs = false, parseDoc = false }) {
  claims.forEach(([ property ]) => validateProperty(property))

  const res = await db.view<EntityValue, InvEntity>('entities', 'byClaim', {
    keys: claims,
    include_docs: includeDocs,
  })

  if (parseDoc) return mapDoc(res)
  else return res
}

export async function getInvUrisByClaim (property, value) {
  const entities = await getInvEntitiesByClaim(property, value, true, true)
  return entities.map(getInvEntityCanonicalUri)
}

export async function getInvEntitiesUrisByClaims (properties, value) {
  const entities = await getInvEntitiesByClaims({
    claims: properties.map(property => [ property, value ]),
    includeDocs: true,
    parseDoc: true,
  })
  return entities.map(getInvEntityCanonicalUri)
}

export async function getInvClaimsByClaimValue (value) {
  const { rows } = await db.view<PropertyUri, InvEntity>('entities', 'byClaimValue', {
    key: value,
    include_docs: false,
  })
  return rows.map(row => ({
    entity: row.id,
    property: row.value,
  }))
}

export async function getInvEntitiesClaimValueCount (value) {
  const { rows } = await db.view<PropertyUri, InvEntity>('entities', 'byClaimValue', {
    key: value,
    include_docs: false,
  })
  return rows.length
}

export async function editInvEntity (params) {
  const { userId, updatedLabels, updatedClaims, currentDoc, batchId, create } = params
  let updatedDoc = cloneDeep(currentDoc)
  updatedDoc = setEntityDocLabels(updatedDoc, updatedLabels)
  updatedDoc = addEntityDocClaims(updatedDoc, updatedClaims)
  return putInvEntityUpdate({ userId, currentDoc, updatedDoc, batchId, create })
}

export async function putInvEntityUpdate (params) {
  const { userId, currentDoc, updatedDoc, create } = params
  assert_.types([ 'string', 'object', 'object' ], [ userId, currentDoc, updatedDoc ])

  beforeEntityDocSave(updatedDoc)

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
    const patchErr = newError('patch creation failed', 500, { currentDoc, updatedDoc })
    patchErr.name = 'patch_creation_failed'
    patchErr.cause = err
    throw patchErr
  }

  return docAfterUpdate
}

export const getUrlFromEntityImageHash = getUrlFromImageHash.bind(null, 'entities')

export const uniqByUri = entities => uniqBy(entities, getUri)

export async function imageIsUsed (imageHash) {
  assert_.string(imageHash)
  const { rows } = await getInvEntitiesByClaim('invp:P2', imageHash)
  return rows.length > 0
}

const getUri = entity => entity.uri

export function getFirstPropertyClaim (entity, property) {
  if (entity.claims?.[property] != null) return entity.claims[property][0]
}

export function setTermsFromClaims (entity) {
  const title = getFirstPropertyClaim(entity, 'wdt:P1476')
  const subtitle = getFirstPropertyClaim(entity, 'wdt:P1680')
  if (title) {
    entity.labels = entity.labels || {}
    entity.labels.fromclaims = title
  }
  if (subtitle) {
    entity.descriptions = entity.descriptions || {}
    entity.descriptions.fromclaims = subtitle
  }
}

export function getAggregatedPropertiesValues (claims, properties) {
  return uniq(Object.values(pick(claims, properties)).flat())
}

export function getWorksAuthorsUris (works) {
  const uris: EntityUri[] = works.map(getWorkAuthorsUris).flat()
  return uniq(uris)
}

function getWorkAuthorsUris (work) {
  return Object.values(pick(work.claims, authorRelationsProperties)).flat()
}
