/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const getAuthorWorks = __.require('controllers', 'entities/lib/get_author_works');
const getEntitiesList = require('../get_entities_list');

module.exports  = authorUris => Promise.all(authorUris.map(getWorksFromAuthorsUri))
.then(_.flatten);

var getWorksFromAuthorsUri = authorUri => getAuthorWorks({ uri: authorUri })
.get('works')
.map(_.property('uri'))
// get full-fledged entity, as getAuthorWorks returns an entity without labels
.then(getEntitiesList);
