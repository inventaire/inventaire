
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const fetchExternalAuthorWorksTitles = __.require('data', 'lib/fetch_external_author_works_titles')

const endpoint = 'http://datos.bne.es/sparql'

const getQuery = bneId => `\
SELECT ?work ?title WHERE {
<http://datos.bne.es/resource/${bneId}> <http://datos.bne.es/def/OP5001> ?work .
?work <http://datos.bne.es/def/P1001> ?title .
}\
`

module.exports = fetchExternalAuthorWorksTitles('bne', endpoint, getQuery)
