const CONFIG = require('config')
const __ = CONFIG.universalPath
const fetchExternalAuthorWorksTitles = require('data/lib/fetch_external_author_works_titles')

const endpoint = 'http://data.bnf.fr/sparql'

// TODO: restrict expressions of work result to Text only
// probably with dcterms:type dcmitype:Text
const getQuery = bnfId => `PREFIX dcterms: <http://purl.org/dc/terms/>
SELECT DISTINCT ?title ?work WHERE {
<http://data.bnf.fr/ark:/12148/cb${bnfId}> foaf:focus ?person .
{ ?work dcterms:creator ?person ;
    rdfs:label ?title . }
UNION
{ ?work dcterms:contributor ?person ;
    rdfs:label ?title . }
}`

module.exports = fetchExternalAuthorWorksTitles('bnf', endpoint, getQuery)
