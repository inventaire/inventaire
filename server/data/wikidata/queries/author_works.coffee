module.exports =
  parameters: [ 'qid' ]
  query: (params)->
    { qid:authorQid } = params
    """
    SELECT ?work ?type ?date ?serie WHERE {
      ?work wdt:P50|wdt:P58|wdt:P110|wdt:P6338 wd:#{authorQid} .
      ?work wdt:P31 ?type .
      OPTIONAL { ?work wdt:P577 ?date . }
      OPTIONAL { ?work wdt:P179 ?serie . }
      OPTIONAL { ?work wdt:P361 ?serie . }
    }
    """
