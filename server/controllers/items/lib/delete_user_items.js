
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const items_ = __.require('controllers', 'items/lib/items')

module.exports = userId => items_.byOwner(userId)
.then(items_.bulkDelete)
