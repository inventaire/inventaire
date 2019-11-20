const CONFIG = require('config')
const __ = CONFIG.universalPath
const fetchExternalAuthorWorksTitles = __.require('data', 'lib/fetch_external_author_works_titles')

const endpoint = 'http://libris.kb.se/sparql'

const getQuery = selibrId => `\
SELECT ?work ?title {
?work <http://purl.org/dc/elements/1.1/creator> <http://libris.kb.se/resource/auth/${selibrId}> .
?work <http://purl.org/dc/elements/1.1/title> ?title .
}\
`

module.exports = fetchExternalAuthorWorksTitles('selibr', endpoint, getQuery)
