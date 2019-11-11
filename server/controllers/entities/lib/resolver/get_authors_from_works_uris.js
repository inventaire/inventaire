/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { Promise } = __.require('lib', 'promises');
const getEntitiesList = require('../get_entities_list');

module.exports = workUris => getEntitiesList(workUris)
.then(getAuthorUris)
.then(_.flatten)
.then(_.compact)
.then(getEntitiesList);

var getAuthorUris = works => works.map(work => work.claims['wdt:P50']);
