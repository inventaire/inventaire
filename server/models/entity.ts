// Entities are equivalent to what Wikidata calls Items
// The data model stays close to Wikidata/Wikibase data model https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON

// Used prefixes:
// Entities (what Wikidata calls Items):
//   PREFIX wd: <http://www.wikidata.org/entity/>
//   PREFIX inv: <https://inventaire.io/entity/>
// Properties:
//   PREFIX wdt: <http://www.wikidata.org/prop/direct/>
//   PREFIX invp: <https://inventaire.io/property/>

import { isString, cloneDeep, without, omit } from 'lodash-es'
import wikimediaLanguageCodesByWdId from 'wikidata-lang/indexes/by_wm_code.js'
import { inferences, type InferedProperties } from '#controllers/entities/lib/inferences'
import { findClaimByValue, getClaimIndex, getClaimValue, isClaimObject, setClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { propertiesValuesConstraints as properties } from '#controllers/entities/lib/properties/properties_values_constraints'
import { isInvPropertyUri, isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { objectEntries, objectFromEntries, sameObjects, superTrim } from '#lib/utils/base'
import { log, warn } from '#lib/utils/logs'
import { objectKeys } from '#lib/utils/types'
import type { NewCouchDoc } from '#server/types/couchdb'
import type { Claims, EntityRedirection, EntityUri, InvClaim, InvClaimObject, InvEntity, InvEntityDoc, Label, Labels, PropertyUri, RemovedPlaceholdersIds, InvPropertyClaims, Reference, WdEntityUri, RemovedPlaceholderEntity, NewInvEntity } from '#types/entity'
import { validateRequiredPropertiesValues } from './validations/validate_required_properties_values.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

const wikimediaLanguageCodes = new Set(Object.keys(wikimediaLanguageCodesByWdId))

export function createBlankEntityDoc () {
  const blankEntity: NewCouchDoc<InvEntity> = {
    type: 'entity' as const,
    labels: {} as Labels,
    claims: {} as Claims,
    created: Date.now() as EpochTimeStamp,
    version: 1,
  }
  return blankEntity
}

export function setEntityDocLabel <D extends (InvEntityDoc | NewInvEntity)> (doc: D, lang: WikimediaLanguageCode, value: Label) {
  assert_.object(doc)
  assert_.string(lang)

  if (!wikimediaLanguageCodes.has(lang)) {
    throw newError('invalid lang', 400, { doc, lang, value })
  }

  preventRedirectionEdit(doc)
  preventRemovedPlaceholderEdit(doc)

  if (value === null) {
    deleteLabel(doc, lang)
  } else {
    assert_.string(value)
    value = superTrim(value)

    if (doc.labels[lang] === value) {
      throw newError('already up-to-date', 400, { doc, lang, value })
    }

    doc.labels[lang] = value
  }

  return doc
}

export function setEntityDocLabels <D extends (InvEntityDoc | NewInvEntity)> (doc: D, labels: Labels) {
  preventRedirectionEdit(doc)
  for (const [ lang, value ] of objectEntries(labels)) {
    doc = setEntityDocLabel(doc, lang, value)
  }

  return doc
}

export function addEntityDocClaims <D extends (InvEntityDoc | NewInvEntity)> (doc: D, newClaims: Claims) {
  preventRedirectionEdit(doc)

  // Pass the list of all edited properties, so that when trying to infer property
  // values, we know which one should not be inferred at the risk of creating a conflict
  const definedProperties = objectKeys(newClaims)

  for (const [ property, propertyClaims ] of objectEntries(newClaims)) {
    for (const claim of propertyClaims) {
      doc = createEntityDocClaim(doc, property, claim, definedProperties)
    }
  }

  return doc
}

export function createEntityDocClaim <D extends (InvEntityDoc | NewInvEntity)> (doc: D, property: PropertyUri, claim: InvClaim, definedProperties?: PropertyUri[]) {
  preventRedirectionEdit(doc)
  return updateEntityDocClaim(doc, property, null, claim, definedProperties)
}

export function updateEntityDocClaim <D extends (InvEntityDoc | NewInvEntity)> (doc: D, property: PropertyUri, oldClaim?: InvClaim, newClaim?: InvClaim, definedProperties?: PropertyUri[]) {
  const context = { doc, property, oldClaim, newClaim }
  preventRedirectionEdit(doc)
  preventRemovedPlaceholderEdit(doc)
  if (oldClaim == null && newClaim == null) {
    throw newError('missing old or new value', 400, context)
  }

  const oldClaimValue = getClaimValue(oldClaim)
  const newClaimValue = getClaimValue(newClaim)
  if (isString(oldClaimValue)) oldClaim = setClaimValue(oldClaim, superTrim(oldClaimValue))
  if (isString(newClaimValue)) newClaim = setClaimValue(newClaim, superTrim(newClaimValue))

  let propArray = doc.claims?.[property]

  if (propArray && newClaim != null && propArray.map(getClaimValue).includes(getClaimValue(newClaim))) {
    throw newError('claim property new value already exist', 400, { propArray, newClaim })
  }

  if (isClaimObject(newClaim)) {
    newClaim = minimizeClaimObject(newClaim)
  }

  if (oldClaim != null) {
    if (propArray != null) {
      propArray = propArray.map(claim => {
        const value = getClaimValue(claim)
        if (isString(value)) {
          return setClaimValue(claim, superTrim(value))
        } else {
          return claim
        }
      })
    }
    if (propArray == null || !propArray.map(getClaimValue).includes(getClaimValue(oldClaim))) {
      throw newError('claim property value not found', 400, context)
    }

    const oldValIndex = getClaimIndex(propArray, oldClaim)
    if (newClaim != null) {
      doc.claims[property][oldValIndex] = newClaim
    } else {
      // if the new value is null, it plays the role of a removeClaim
      propArray.splice(oldValIndex, 1)

      setPossiblyEmptyPropertyArray(doc, property, propArray)
    }
  } else {
    // if the old value is null, it plays the role of a createClaim
    doc.claims[property] ??= []
    doc.claims[property].push(newClaim)
  }

  return updateInferredProperties(doc, property, oldClaim, newClaim, definedProperties)
}

function minimizeClaimObject (claim: InvClaimObject) {
  if (isNonEmptyArray(claim.references)) {
    return claim
  } else {
    return claim.value
  }
}

export function beforeEntityDocSave (doc: InvEntityDoc | NewInvEntity) {
  // Do not validate redirections, removed placeholder, etc
  if ('claims' in doc && doc.type === 'entity') {
    removeEmptyClaimArrays(doc.claims)
    validateRequiredPropertiesValues(doc)
  }
  doc.updated = Date.now()
  doc.version++
  return doc
}

function removeEmptyClaimArrays (claims: Claims) {
  for (const [ property, propertyClaims ] of objectEntries(claims)) {
    if (propertyClaims.length === 0) delete claims[property]
  }
}

export function isLocalEntityLayer (doc: InvEntityDoc | Pick<InvEntity, 'claims'>) {
  if ('redirect' in doc) return false
  return doc.claims['invp:P1']?.[0] != null
}

// 'from' and 'to' refer to the redirection process which rely on merging
// two existing document: redirecting from an entity to another entity,
// only the 'to' doc will survive
export function mergeEntitiesDocs (fromEntityDoc: InvEntityDoc | EntityRedirection, toEntityDoc: InvEntityDoc | EntityRedirection) {
  preventRedirectionEdit(fromEntityDoc)
  preventRedirectionEdit(toEntityDoc)

  for (const [ lang, value ] of Object.entries(fromEntityDoc.labels)) {
    toEntityDoc.labels[lang] ??= value
  }

  mergeClaims(fromEntityDoc.claims, toEntityDoc.claims)

  return toEntityDoc
}

function mergeClaims (fromClaims: Claims, toClaims: Claims) {
  for (const [ property, fromPropertyClaims ] of objectEntries(fromClaims)) {
    const toPropertyClaims = toClaims[property] ??= []
    mergePropertyClaims(property, fromPropertyClaims, toPropertyClaims)
  }
}

function mergePropertyClaims (property: PropertyUri, fromPropertyClaims: InvPropertyClaims, toPropertyClaims: InvPropertyClaims) {
  for (const claim of fromPropertyClaims) {
    const matchingClaim = findClaimByValue(toPropertyClaims, claim)
    if (matchingClaim) {
      const matchingClaimIndex = toPropertyClaims.indexOf(matchingClaim)
      toPropertyClaims[matchingClaimIndex] = mergeClaimReferences(claim, matchingClaim)
    } else {
      if (toPropertyClaims.length > 0) {
        if (properties[property].uniqueValue) {
          warn(claim, `${property} can have only one value: ignoring merged entity claim`)
        } else if (properties[property].hasPlaceholders) {
          warn(claim, `${property} values may be placeholders: ignoring merged entity claim`)
        } else {
          toPropertyClaims.push(claim)
        }
      } else {
        toPropertyClaims.push(claim)
      }
    }
  }
}

function mergeClaimReferences (fromClaim: InvClaim, toClaim: InvClaim) {
  if (isClaimObject(fromClaim)) {
    if (isClaimObject(toClaim)) {
      for (const ref of fromClaim.references) {
        if (!includesReference(toClaim.references, ref)) {
          toClaim.references.push(ref)
        }
      }
      return toClaim
    } else {
      return { value: toClaim, references: fromClaim.references }
    }
  } else {
    return toClaim
  }
}

function includesReference (references: Reference[], reference: Reference) {
  return references.find(ref => sameObjects(ref, reference))
}

export function convertEntityDocIntoALocalLayer (localEntity: InvEntity, remoteEntityUri: WdEntityUri) {
  return {
    ...localEntity,
    labels: {},
    claims: {
      'invp:P1': [ remoteEntityUri ],
      ...pickLocalClaims(localEntity.claims),
    },
  }
}

function pickLocalClaims (claims: Claims) {
  return objectFromEntries(objectEntries(claims).filter(([ property ]) => isInvPropertyUri(property))) as Claims
}

export function convertEntityDocIntoARedirection (fromEntityDoc: InvEntity, toUri: EntityUri, removedPlaceholdersIds: RemovedPlaceholdersIds = []) {
  const [ prefix, id ] = toUri.split(':')

  if (prefix === 'inv' && id === fromEntityDoc._id) {
    throw newError('circular redirection', 500, { fromEntityDoc, toUri, removedPlaceholdersIds })
  }
  const redirection: EntityRedirection = {
    ...omit(fromEntityDoc, [ 'labels', 'claims' ]),
    redirect: toUri,
    // The list of placeholders entities to recover if the merge as to be reverted
    removedPlaceholdersIds,
  }
  return redirection
}

export function convertEntityDocToPlaceholder (entityDoc: InvEntity) {
  if ('redirect' in entityDoc) {
    const message = "can't turn a redirection into a removed placeholder"
    throw newError(message, 400, { entityDoc })
  }

  return Object.assign(cloneDeep(entityDoc), { type: 'removed:placeholder' })
}

export function recoverEntityDocFromPlaceholder (entityDoc: InvEntity) {
  return Object.assign(cloneDeep(entityDoc), { type: 'entity' })
}

export function preventRedirectionEdit (doc: InvEntityDoc | NewInvEntity): asserts doc is (Exclude<(InvEntityDoc | NewInvEntity), EntityRedirection>) {
  if ('redirect' in doc) {
    throw newError('entity edit failed: the entity is a redirection', 400, { doc })
  }
}

export function preventRemovedPlaceholderEdit (doc: InvEntityDoc | NewInvEntity): asserts doc is (Exclude<(InvEntityDoc | NewInvEntity), RemovedPlaceholderEntity>) {
  if ('type' in doc && doc.type === 'removed:placeholder') {
    throw newError('entity edit failed: the entity is a removed placeholder', 400, { doc })
  }
}

export function assertEditableEntity (doc: InvEntityDoc): asserts doc is InvEntity {
  preventRedirectionEdit(doc)
  preventRemovedPlaceholderEdit(doc)
}

export function preventLocalLayerEdit (doc: InvEntityDoc | NewInvEntity) {
  if (isLocalEntityLayer(doc)) {
    throw newError('entity edit failed: the entity is a local entity layer', 400, { doc })
  }
}

function updateInferredProperties <D extends (InvEntity | NewInvEntity)> (doc: D, property: PropertyUri, oldVal?: InvClaim, newVal?: InvClaim, definedProperties: PropertyUri[] = []) {
  const propInferences: InferedProperties = omit(inferences[property], definedProperties)

  const addingOrUpdatingValue = (newVal != null)

  for (const [ inferredProperty, convertor ] of objectEntries(propInferences)) {
    let inferredPropertyArray = doc.claims[inferredProperty] || []

    if (addingOrUpdatingValue) {
      const inferredValue = convertor(getClaimValue(newVal))
      // Known case of missing infered value:
      // ISBN-13 with a 979 prefix will not have an ISBN-10
      if (inferredValue != null) {
        if (!inferredPropertyArray.includes(inferredValue)) {
          inferredPropertyArray.push(inferredValue)
          log(inferredValue, `added inferred ${inferredProperty} from ${property}`)
        }
      } else {
        warn(newVal, `inferred value not found for ${inferredProperty} from ${property}`)
      }
    } else {
      // The current entity data model doesn't allow to check if the claim was
      // indeed inferred or if it was manually added.
      // This could be made possible by replacing claims direct values by an object:
      // {
      //   id: 'claim uuid prefixed by property uri (following wikidata data model)',
      //   value: "claim value",
      //   inferredFrom: 'claim id'
      // }
      const inferredValue = convertor(getClaimValue(oldVal))
      if (inferredPropertyArray.includes(inferredValue)) {
        inferredPropertyArray = without(inferredPropertyArray, inferredValue)
        log(inferredValue, `removed inferred ${inferredProperty} from ${property}`)
      }
    }

    setPossiblyEmptyPropertyArray(doc, inferredProperty, inferredPropertyArray)
  }

  return doc
}

function setPossiblyEmptyPropertyArray (doc: InvEntity | NewInvEntity, property: PropertyUri, propertyArray: InvClaim[]) {
  if (propertyArray.length === 0) {
    // if empty, clean the doc from the property
    doc.claims = omit(doc.claims, property)
  } else {
    doc.claims[property] = propertyArray
  }
}

function deleteLabel (doc: InvEntity | NewInvEntity, lang: WikimediaLanguageCode) {
  if (doc.labels[lang] == null) {
    throw newError('can not delete a non-existant label', 400, { doc, lang })
  }

  if (Object.keys(doc.labels).length === 1) {
    throw newError('can not delete the last label', 400, { doc, lang })
  }

  delete doc.labels[lang]
}
