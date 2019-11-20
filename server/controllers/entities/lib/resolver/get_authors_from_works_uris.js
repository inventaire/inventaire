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
