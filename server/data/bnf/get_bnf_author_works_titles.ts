import fetchExternalAuthorWorksTitles from '#data/lib/fetch_external_author_works_titles'

const endpoint = 'http://data.bnf.fr/sparql'

// TODO: restrict expressions of work result to Text only
// probably with dcterms:type dcmitype:Text
const getQuery = bnfId => `PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?title ?work WHERE {
<http://data.bnf.fr/ark:/12148/cb${bnfId}> foaf:focus ?person .
{ ?work dcterms:creator ?person ;
    rdfs:label ?title . }
UNION
{ ?work dcterms:contributor ?person ;
    rdfs:label ?title . }
}`

export default fetchExternalAuthorWorksTitles('bnf', endpoint, getQuery)
