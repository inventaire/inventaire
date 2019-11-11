/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const comments_ = __.require('controllers', 'comments/lib/comments');
const items_ = __.require('controllers', 'items/lib/items');
const promises_ = __.require('lib', 'promises');

module.exports = userId => items_.byOwner(userId)
.then(items_.bulkDelete);
