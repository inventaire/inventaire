module.exports = (_)->
  return API =
    wikidata:
      base: 'https://www.wikidata.org/w/api.php'
      # keeping a different search
      search: (search, limit = '25', format = 'json')->
        _.buildPath API.wikidata.base,
          action: 'query'
          list: 'search'
          srlimit: limit
          format: format
          srsearch: search
          origin: '*'
