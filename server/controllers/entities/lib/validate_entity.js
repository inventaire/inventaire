/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const error_ = __.require('lib', 'error/error');
const assert_ = __.require('utils', 'assert_types');
const entities_ = require('./entities');
const { Lang } = __.require('lib', 'regex');
const promises_ = __.require('lib', 'promises');
const getEntityType = require('./get_entity_type');
const validateClaims =  require('./validate_claims');
const typesWithoutLabels = require('./types_without_labels');

module.exports = entity => promises_.try(() => validate(entity))
.catch(addErrorContext(entity));

var validate = function(entity){
  const { labels, claims } = entity;
  assert_.object(labels);
  assert_.object(claims);

  const type = getValueType(claims);
  validateValueType(type, claims['wdt:P31']);
  validateLabels(labels, type);
  return validateClaims({
    newClaims: claims,
    currentClaims: {},
    creating: true
  });
};

var getValueType = function(claims){
  const wdtP31 = claims['wdt:P31'];
  if (!_.isNonEmptyArray(wdtP31)) {
    throw error_.new("wdt:P31 array can't be empty", 400, wdtP31);
  }
  return getEntityType(wdtP31);
};

var validateValueType = function(type, wdtP31){
  if (type == null) {
    throw error_.new("wdt:P31 value isn't a known valid value", 400, wdtP31);
  }
};

var validateLabels = function(labels, type){
  if (typesWithoutLabels.includes(type)) {
    if (_.isNonEmptyPlainObject(labels)) {
      throw error_.new(`${type}s can't have labels`, 400, { type, labels });
    }
  } else {
    if (!_.isNonEmptyPlainObject(labels)) {
      throw error_.new('invalid labels', 400, { type, labels });
    }

    return (() => {
      const result = [];
      for (let lang in labels) {
        const value = labels[lang];
        if (!Lang.test(lang)) {
          throw error_.new(`invalid label language: ${lang}`, 400, { type, labels });
        }

        if (!_.isNonEmptyString(value)) {
          throw error_.new(`invalid label value: ${value}`, 400, { type, labels });
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }
};

var addErrorContext = entity => (function(err) {
  if (err.context == null) { err.context = { entity }; }
  throw err;
});
