import fetchExternalAuthorWorksTitles from '#data/lib/fetch_external_author_works_titles'

const endpoint = 'https://jpsearch.go.jp/rdf/sparql'

const getQuery = ndlId => `SELECT * WHERE {
?work <http://schema.org/creator> <http://id.ndl.go.jp/auth/entity/${ndlId}> .
?work <http://schema.org/name> ?title .
}`

export default fetchExternalAuthorWorksTitles('ndl', endpoint, getQuery)
