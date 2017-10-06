# Counting the truthy statements linking to an entity
# cf https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format#Truthy_statements
module.exports =
  parameters: [ 'qid' ]
  query: (params)->
    { qid } = params
    """
    SELECT DISTINCT (COUNT(?statement) AS ?statementCount) WHERE {
      ?statement ?property wd:#{qid} .
      ?property wikibase:directClaim ?wdt.
    }
    """
