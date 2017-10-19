# Counting the truthy statements linking to an entity
# cf https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format#Truthy_statements
# See also https://stackoverflow.com/questions/39438022/wikidata-results-sorted-by-something-similar-to-a-pagerank
module.exports =
  parameters: [ 'qid' ]
  query: (params)->
    { qid } = params
    """
    SELECT DISTINCT (COUNT(?entity) AS ?entityCount) WHERE {
      ?entity ?property wd:#{qid} .
      ?property wikibase:directClaim ?wdt .
    }
    """
