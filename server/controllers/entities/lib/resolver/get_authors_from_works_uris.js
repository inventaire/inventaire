// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const getEntitiesList = require('../get_entities_list')

module.exports = workUris => getEntitiesList(workUris)
.then(getAuthorUris)
.then(_.flatten)
.then(_.compact)
.then(getEntitiesList)

const getAuthorUris = works => works.map(work => work.claims['wdt:P50'])
