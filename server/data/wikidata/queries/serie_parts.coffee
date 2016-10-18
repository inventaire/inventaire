module.exports =
  parameters: ['qid']
  query: (params)->
    { qid:serieQid } = params
    """
    SELECT ?part WHERE {
      { ?part wdt:P179 wd:#{serieQid} . }
      UNION
      { ?part wdt:P361 wd:#{serieQid} . }
    }
    """
