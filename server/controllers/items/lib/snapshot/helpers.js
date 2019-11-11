/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const assert_ = __.require('utils', 'assert_types');
const getEntityType = __.require('controllers', 'entities/lib/get_entity_type');
const getInvEntityCanonicalUri = __.require('controllers', 'entities/lib/get_inv_entity_canonical_uri');
const getBestLangValue = __.require('lib', 'get_best_lang_value');

module.exports = {
  getDocData(updatedDoc){
    let { uri, type } = updatedDoc;
    // Case when a formatted entity doc is passed
    if (uri != null) { return [ uri, type ]; }

    // Case when a raw entity doc is passed,
    // which can only be an inv entity doc
    uri = getInvEntityCanonicalUri(updatedDoc);
    type = getEntityType(updatedDoc.claims['wdt:P31']);
    return [ uri, type ];
  },

  getNames(preferedLang, entities){
    if (!_.isNonEmptyArray(entities)) { return; }

    return entities
    .map(getName(preferedLang))
    .join(', ');
  },

  aggregateClaims(entities, property){
    assert_.array(entities);
    assert_.string(property);

    return _(entities)
    .filter(function(entity){
      const hasClaims = (entity.claims != null);
      if (hasClaims) { return true; }
      // Trying to identify how entities with no claims arrive here
      _.warn(entity, 'entity with no claim at aggregateClaims');
      return false;}).map(entity => entity.claims[property])
    .flatten()
    .compact()
    .uniq()
    .value();
  }
};

var getName = lang => entity => getBestLangValue(lang, entity.originalLang, entity.labels).value;
