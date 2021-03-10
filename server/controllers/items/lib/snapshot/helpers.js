const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const getEntityType = require('controllers/entities/lib/get_entity_type')
const getInvEntityCanonicalUri = require('controllers/entities/lib/get_inv_entity_canonical_uri')
const getBestLangValue = require('lib/get_best_lang_value')

module.exports = {
  getDocData: updatedDoc => {
    let { uri, type } = updatedDoc
    // Case when a formatted entity doc is passed
    if (uri) return [ uri, type ]

    // Case when a raw entity doc is passed,
    // which can only be an inv entity doc
    uri = getInvEntityCanonicalUri(updatedDoc)
    type = getEntityType(updatedDoc.claims['wdt:P31'])
    return [ uri, type ]
  },

  getNames: (preferedLang, entities) => {
    if (!_.isNonEmptyArray(entities)) return

    return entities
    .map(getName(preferedLang))
    .join(', ')
  },

  aggregateClaims: (entities, property) => {
    assert_.array(entities)
    assert_.string(property)

    return _(entities)
    .filter(entity => {
      const hasClaims = (entity.claims != null)
      if (hasClaims) return true
      // Trying to identify how entities with no claims arrive here
      _.warn(entity, 'entity with no claim at aggregateClaims')
      return false
    })
    .map(entity => entity.claims[property])
    .flatten()
    .compact()
    .uniq()
    .value()
  }
}

const getName = lang => entity => {
  const { originalLang, labels } = entity
  return getBestLangValue(lang, originalLang, labels).value
}
