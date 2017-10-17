module.exports =
  parameters: [ 'qid' ]
  query: (params)->
    { qid } = params
    """
    SELECT DISTINCT ?item WHERE {
      ?item wdt:P921 wd:#{qid} .
      # book
      { ?item wdt:P31/wdt:P279* wd:Q571 . }
      # literary work
      UNION { ?item wdt:P31/wdt:P279* wd:Q7725634 . }
      # comic book album
      UNION { ?item wdt:P31/wdt:P279* wd:Q2831984 . }
      # comic book
      UNION { ?item wdt:P31/wdt:P279* wd:Q1004 . }
      # manga
      UNION { ?item wdt:P31/wdt:P279* wd:Q8274 . }
      # book series
      UNION { ?item wdt:P31/wdt:P279* wd:Q277759 . }
      # comic book series
      UNION { ?item wdt:P31/wdt:P279* wd:Q14406742 . }
      # manga series
      UNION { ?item wdt:P31/wdt:P279* wd:Q21198342 . }
      # novel series
      UNION { ?item wdt:P31/wdt:P279* wd:Q1667921 . }
    }
    LIMIT 1000
    """
