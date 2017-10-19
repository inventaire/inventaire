module.exports =
  parameters: [ 'pid', 'qid' ]
  query: (params)->
    { pid, qid } = params
    """
    SELECT DISTINCT ?item WHERE {
      ?item wdt:#{pid} wd:#{qid} .
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
      # Filter-out entities tagged as both work and edition
      FILTER NOT EXISTS { ?item wdt:P31 wd:Q3331189 }
    }
    LIMIT 1000
    """
