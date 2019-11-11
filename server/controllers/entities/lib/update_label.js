const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const error_ = __.require('lib', 'error/error');
const entities_ = require('./entities');
const Entity = __.require('models', 'entity');
const getEntityType = require('./get_entity_type');
const typesWithoutLabels = require('./types_without_labels');

module.exports = function(lang, value, userId, currentDoc){
  checkEntityTypeCanHaveLabel(currentDoc);

  let updatedDoc = _.cloneDeep(currentDoc);
  updatedDoc = Entity.setLabel(updatedDoc, lang, value);
  return entities_.putUpdate({ userId, currentDoc, updatedDoc });
};

var checkEntityTypeCanHaveLabel = function(currentDoc){
  const type = getEntityType(currentDoc.claims['wdt:P31']);

  if (typesWithoutLabels.includes(type)) {
    throw error_.new(`${type}s can't have labels`, 400);
  }
};
