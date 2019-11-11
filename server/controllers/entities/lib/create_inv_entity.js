/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let prefixifyInv;
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const entities_ = require('./entities');
const validateEntity = require('./validate_entity');
let { unprefixify } = require('./prefix');
({ prefixifyInv, unprefixify } = require('./prefix'));

module.exports = function(params){
  const { labels, claims, userId, batchId } = params;
  _.log(params, 'inv entity creation');

  return validateEntity({ labels, claims })
  .then(() => entities_.createBlank())
  .then(currentDoc => entities_.edit({
    userId,
    currentDoc,
    updatedLabels: labels,
    updatedClaims: claims,
    batchId
  }))
  .then(function(entity){
    entity.uri = prefixifyInv(entity._id);
    return entity;
  });
};
