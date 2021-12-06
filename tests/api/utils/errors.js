const makeSparqlRequest = require('server/data/wikidata/make_sparql_request')

module.exports = {
  throwWithSuggestions: async (message, query, id) => {
    const rows = await makeSparqlRequest(query)
    throw new Error(`${id} : ${message}, replacement suggestions: ${rows}`)
  }
}
