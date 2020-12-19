// DATA MODEL
// _id: CouchDB uuid
// claims: an object with properties and their associated statements
// labels: an object with labels in different languages

// labels?
// descriptions?
// aliases?
// sitelinks? qid?

// use Wikidata data model as reference:
// https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON

// Used prefixes:
// Entities:
//   PREFIX wd: <http://www.wikidata.org/entity/>
//   PREFIX inv: <https://inventaire.io/entity/>
// Properties:
//   PREFIX wdt: <http://www.wikidata.org/prop/direct/>
//   PREFIX invp: <https://inventaire.io/property/>

// Inventaire properties:
// invp:P2: Image Hash

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const validLangs = Object.keys(require('wikidata-lang').byCode)

const properties = __.require('controllers', 'entities/lib/properties/properties_values_constraints')
const validateRequiredPropertiesValues = require('./validations/validate_required_properties_values')
const inferences = __.require('controllers', 'entities/lib/inferences')

const Entity = module.exports = {
  create: () => {
    return {
      type: 'entity',
      labels: {},
      claims: {},
      created: Date.now(),
      version: 1,
    }
  },

  setLabel: (doc, lang, value) => {
    assert_.object(doc)
    assert_.string(lang)
    assert_.string(value)

    if (!validLangs.includes(lang)) {
      throw error_.new('invalid lang', 400, { doc, lang, value })
    }

    Entity.preventRedirectionEdit(doc, 'setLabel')

    value = _.superTrim(value)

    if (doc.labels[lang] === value) {
      throw error_.new('already up-to-date', 400, { doc, lang, value })
    }

    doc.labels[lang] = value

    return doc
  },

  setLabels: (doc, labels) => {
    Entity.preventRedirectionEdit(doc, 'setLabels')
    for (const lang in labels) {
      const value = labels[lang]
      doc = Entity.setLabel(doc, lang, value)
    }

    return doc
  },

  addClaims: (doc, claims) => {
    Entity.preventRedirectionEdit(doc, 'addClaims')

    // Pass the list of all edited properties, so that wen trying to infer property
    // values, we know which one should not be infered at the risk of creating
    // a conflict
    doc._allClaimsProps = Object.keys(claims)

    for (const property in claims) {
      const array = claims[property]
      for (const value of array) {
        doc = Entity.createClaim(doc, property, value)
      }
    }

    delete doc._allClaimsProps

    return doc
  },

  createClaim: (doc, property, value) => {
    Entity.preventRedirectionEdit(doc, 'createClaim')
    return Entity.updateClaim(doc, property, null, value)
  },

  updateClaim: (doc, property, oldVal, newVal) => {
    const context = { doc, property, oldVal, newVal }
    Entity.preventRedirectionEdit(doc, 'updateClaim')
    if (oldVal == null && newVal == null) {
      throw error_.new('missing old or new value', 400, context)
    }

    if (_.isString(oldVal)) oldVal = _.superTrim(oldVal)
    if (_.isString(newVal)) newVal = _.superTrim(newVal)

    let propArray = _.get(doc, `claims.${property}`)
    _.info(`${property} propArray: ${propArray} /oldVal: ${oldVal} /newVal: ${newVal}`)

    if (propArray && newVal != null && propArray.includes(newVal)) {
      throw error_.new('claim property new value already exist', 400, [ propArray, newVal ])
    }

    if (oldVal != null) {
      if (propArray == null || !propArray.includes(oldVal)) {
        throw error_.new('claim property value not found', 400, context)
      }

      if (newVal != null) {
        const index = propArray.indexOf(oldVal)
        doc.claims[property][index] = newVal
      } else {
        // if the new value is null, it plays the role of a removeClaim
        propArray = _.without(propArray, oldVal)

        setPossiblyEmptyPropertyArray(doc, property, propArray)
      }
    } else {
      // if the old value is null, it plays the role of a createClaim
      if (!doc.claims[property]) doc.claims[property] = []
      doc.claims[property].push(newVal)
    }

    return updateInferredProperties(doc, property, oldVal, newVal)
  },

  beforeSave: doc => {
    // Do not validate redirections, removed placeholder, etc
    if (doc.claims != null) {
      validateRequiredPropertiesValues(doc.claims)
    }
    doc.updated = Date.now()
    if (doc.version != null) doc.version++
    return doc
  },

  // 'from' and 'to' refer to the redirection process which rely on merging
  // two existing document: redirecting from an entity to another entity,
  // only the 'to' doc will survive
  mergeDocs: (fromEntityDoc, toEntityDoc) => {
    Entity.preventRedirectionEdit(fromEntityDoc, 'mergeDocs (from)')
    Entity.preventRedirectionEdit(toEntityDoc, 'mergeDocs (to)')

    for (const lang in fromEntityDoc.labels) {
      const value = fromEntityDoc.labels[lang]
      if (toEntityDoc.labels[lang] == null) {
        toEntityDoc.labels[lang] = value
      }
    }

    for (const property in fromEntityDoc.claims) {
      const values = fromEntityDoc.claims[property]
      if (toEntityDoc.claims[property] == null) { toEntityDoc.claims[property] = [] }
      for (const value of values) {
        if (!toEntityDoc.claims[property].includes(value)) {
          if (toEntityDoc.claims[property].length > 0) {
            if (properties[property].uniqueValue) {
              _.warn(value, `${property} can have only one value: ignoring merged entity value`)
            } else if (properties[property].hasPlaceholders) {
              _.warn(value, `${property} values may be placeholders: ignoring merged entity value`)
            } else {
              toEntityDoc.claims[property].push(value)
            }
          } else {
            toEntityDoc.claims[property].push(value)
          }
        }
      }
    }

    return toEntityDoc
  },

  turnIntoRedirection: (fromEntityDoc, toUri, removedPlaceholdersIds) => {
    const [ prefix, id ] = toUri.split(':')

    if (prefix === 'inv' && id === fromEntityDoc._id) {
      throw error_.new('circular redirection', 500, { fromEntityDoc, toUri, removedPlaceholdersIds })
    }

    const redirection = _.cloneDeep(fromEntityDoc)

    redirection.redirect = toUri
    delete redirection.labels
    delete redirection.claims
    // the list of placeholders entities to recover if the merge as to be reverted
    redirection.removedPlaceholdersIds = removedPlaceholdersIds

    return redirection
  },

  removePlaceholder: entityDoc => {
    if (entityDoc.redirect) {
      const message = "can't turn a redirection into a removed placeholder"
      throw error_.new(message, 400, entityDoc)
    }

    const removedDoc = _.cloneDeep(entityDoc)
    removedDoc.type = 'removed:placeholder'
    return removedDoc
  },

  recoverPlaceholder: entityDoc => {
    const recoveredDoc = _.cloneDeep(entityDoc)
    recoveredDoc.type = 'entity'
    return recoveredDoc
  },

  preventRedirectionEdit: (doc, editLabel) => {
    if (doc.redirect == null) return
    throw error_.new(`${editLabel} failed: the entity is a redirection`, 400, { doc, editLabel })
  }
}

const updateInferredProperties = (doc, property, oldVal, newVal) => {
  const declaredProperties = doc._allClaimsProps || []
  // Use _allClaimsProps to list properties that shouldn't be inferred
  const propInferences = _.omit(inferences[property], declaredProperties)

  const addingOrUpdatingValue = (newVal != null)

  for (const inferredProperty in propInferences) {
    const convertor = propInferences[inferredProperty]
    let inferredPropertyArray = doc.claims[inferredProperty] || []

    if (addingOrUpdatingValue) {
      const inferredValue = convertor(newVal)
      // Known case of missing infered value:
      // ISBN-13 with a 979 prefix will not have an ISBN-10
      if (inferredValue != null) {
        if (!inferredPropertyArray.includes(inferredValue)) {
          inferredPropertyArray.push(inferredValue)
          _.log(inferredValue, `added inferred ${inferredProperty} from ${property}`)
        }
      } else {
        _.warn(newVal, `inferred value not found for ${inferredProperty} from ${property}`)
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
      const inferredValue = convertor(oldVal)
      if (inferredPropertyArray.includes(inferredValue)) {
        inferredPropertyArray = _.without(inferredPropertyArray, inferredValue)
        _.log(inferredValue, `removed inferred ${inferredProperty} from ${property}`)
      }
    }

    setPossiblyEmptyPropertyArray(doc, inferredProperty, inferredPropertyArray)
  }

  return doc
}

const setPossiblyEmptyPropertyArray = (doc, property, propertyArray) => {
  if (propertyArray.length === 0) {
    // if empty, clean the doc from the property
    doc.claims = _.omit(doc.claims, property)
  } else {
    doc.claims[property] = propertyArray
  }
}
