# Counting the truthy statements linking to an entity
# cf https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format#Truthy_statements
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
