const CONFIG = require('config')
const __ = CONFIG.universalPath
const fetchExternalAuthorWorksTitles = __.require('data', 'lib/fetch_external_author_works_titles')

const endpoint = 'http://bnb.data.bl.uk/sparql'

const getQuery = bnbId => `PREFIX dct: <http://purl.org/dc/terms/>
SELECT DISTINCT ?title ?work WHERE {
?work dct:creator <http://bnb.data.bl.uk/id/person/${bnbId}>;
    dct:title ?title .
}`

module.exports = fetchExternalAuthorWorksTitles('bnb', endpoint, getQuery)
