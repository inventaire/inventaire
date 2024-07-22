import { uniqBy, cloneDeep, identity, pick, uniq } from 'lodash-es'
import { getClaimValue, getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import dbFactory from '#db/couchdb/base'
import { mapDoc } from '#lib/couch'
import { newError } from '#lib/error/error'
import { getUrlFromImageHash } from '#lib/images'
import { toIsbn13h } from '#lib/isbn/isbn'
import { emit } from '#lib/radio'
import { assert_ } from '#lib/utils/assert_types'
import { addEntityDocClaims, beforeEntityDocSave, setEntityDocLabels } from '#models/entity'
import type { EntityImagePath, ImageHash } from '#server/types/image'
import type { EntityUri, InvEntityDoc, EntityValue, PropertyUri, InvEntity, Isbn, InvClaimValue, SerializedEntity, WdEntityId, WdEntityUri } from '#types/entity'
import { getInvEntityCanonicalUri } from './get_inv_entity_canonical_uri.js'
import createPatch from './patches/create_patch.js'
import { validateProperty } from './properties/validations.js'
import type { DocumentViewResponse } from 'blue-cot/types/nano.js'

const db = await dbFactory('entities')

export const getEntityById = db.get<InvEntityDoc>
export const getEntitiesByIds = db.byIds<InvEntityDoc>

export function getInvEntitiesByIsbns (isbns: Isbn[]) {
  const keys = isbns
    .map(toIsbn13h)
    .filter(identity)
    .map(isbn => [ 'wdt:P212', isbn ])
  return db.getDocsByViewKeys<InvEntity>('byClaim', keys)
}

export async function getInvEntityByIsbn (isbn: Isbn) {
  const docs = await getInvEntitiesByIsbns([ isbn ])
  return docs[0]
}

export async function getInvEntitiesByClaim (property: PropertyUri, value: InvClaimValue, includeDocs?: false, parseDoc?: false): Promise<DocumentViewResponse<EntityValue, undefined>>
export async function getInvEntitiesByClaim (property: PropertyUri, value: InvClaimValue, includeDocs?: true, parseDoc?: false): Promise<DocumentViewResponse<EntityValue, InvEntity>>
export async function getInvEntitiesByClaim (property: PropertyUri, value: InvClaimValue, includeDocs?: true, parseDoc?: true): Promise<InvEntity[]>
export async function getInvEntitiesByClaim (property: PropertyUri, value: InvClaimValue, includeDocs = false, parseDoc = false) {
  validateProperty(property)

  const res = await db.view<EntityValue, InvEntity>('entities', 'byClaim', {
    key: [ property, value ],
    include_docs: includeDocs,
  })

  if (parseDoc) return mapDoc(res)
  else return res
}

export type ClaimPropertyValueTuple = [ PropertyUri, InvClaimValue ]

export async function getInvEntitiesByClaims (claims: ClaimPropertyValueTuple[]) {
  claims.forEach(([ property ]) => validateProperty(property))
  const res = await db.view<EntityValue, InvEntity>('entities', 'byClaim', {
    keys: claims,
    include_docs: true,
  })
  return res
}

export async function getInvUrisByClaim (property: PropertyUri, value: InvClaimValue) {
  const entities = await getInvEntitiesByClaim(property, value, true, true)
  return entities.map(getInvEntityCanonicalUri)
}

export async function getInvEntitiesUrisByClaims (properties: PropertyUri[], value: InvClaimValue) {
  const claims: ClaimPropertyValueTuple[] = properties.map(property => [ property, value ])
  const res = await getInvEntitiesByClaims(claims)
  const entities = mapDoc(res)
  return entities.map(getInvEntityCanonicalUri)
}

export async function getInvClaimsByClaimValue (value: InvClaimValue) {
  const { rows } = await db.view<PropertyUri, InvEntity>('entities', 'byClaimValue', {
    key: value,
    include_docs: false,
  })
  return rows.map(row => ({
    entity: row.id,
    property: row.value,
  }))
}

export async function getInvEntitiesClaimValueCount (value: InvClaimValue) {
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
  if (currentDoc === updatedDoc) {
    throw newError('currentDoc and updatedDoc can not be the same object', 500, params)
  }

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

export const getUrlFromEntityImageHash = (imageHash: ImageHash) => getUrlFromImageHash('entities', imageHash) as EntityImagePath

export const uniqByUri = entities => uniqBy(entities, getUri)

export async function imageIsUsed (imageHash: ImageHash) {
  assert_.string(imageHash)
  const { rows } = await getInvEntitiesByClaim('invp:P2', imageHash)
  return rows.length > 0
}

const getUri = entity => entity.uri

export function setTermsFromClaims (entity: SerializedEntity) {
  const title = getFirstClaimValue(entity.claims, 'wdt:P1476')
  const subtitle = getFirstClaimValue(entity.claims, 'wdt:P1680')
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
  return uniq(Object.values(pick(claims, properties)).flat().map(getClaimValue))
}

export function getWorksAuthorsUris (works) {
  const uris: EntityUri[] = works.map(getWorkAuthorsUris).flat()
  return uniq(uris)
}

function getWorkAuthorsUris (work) {
  return Object.values(pick(work.claims, workAuthorRelationsProperties)).flat()
}

export async function getWdEntityLocalLayer (wdId: WdEntityId) {
  const res = await db.view<EntityValue, InvEntity>('entities', 'byClaim', {
    key: [ 'invp:P1', `wd:${wdId}` ],
    include_docs: true,
  })
  return res.rows[0]?.doc
}

export async function wdEntityHasALocalLayer (wdUri: WdEntityUri) {
  const wdId = unprefixify(wdUri)
  const localLayer = await getWdEntityLocalLayer(wdId)
  return localLayer != null
}
