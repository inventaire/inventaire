/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const error_ = __.require('lib', 'error/error');
const { Promise } = __.require('lib', 'promises');
const wdk = require('wikidata-sdk');
const wdEdit = require('wikidata-edit');
const wdOauth = require('./wikidata_oauth');

module.exports = (...args) => Promise.try(() => updateWdLabel(...Array.from(args || [])));

var updateWdLabel = function(user, id, lang, value){
  if (!wdk.isItemId(id)) { throw error_.newInvalid('id', id); }

  wdOauth.validate(user);
  const oauth = wdOauth.getFullCredentials(user);

  return wdEdit({ oauth }, 'label/set')(id, lang, value);
};
