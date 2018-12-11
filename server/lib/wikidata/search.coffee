__ = require('config').universalPath
_ = __.require 'builders', 'utils'
base = 'https://www.wikidata.org/w/api.php'

module.exports = (search, limit = '25', format = 'json')->
  _.buildPath base,
    action: 'query'
    list: 'search'
    srlimit: limit
    format: format
    srsearch: search
    origin: '*'
