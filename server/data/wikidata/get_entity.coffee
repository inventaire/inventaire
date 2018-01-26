# A request regrouper to query entities full data one by one
# while requests are actually regrouped in the background
CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requestGrouper = __.require 'lib', 'request_grouper'
promises_ = __.require 'lib', 'promises'
{ getEntities, getManyEntities } = require 'wikidata-sdk'

requester = (ids)->
  if ids.length > 50
    # Using getManyEntities to work around the 50 entities limit
    # But, normally, caching should allow to limit its use to some
    # exceptionnal requests (like when someone wants refreshed data
    # of the whole Victor Hugo bibliographie)
    urls = getManyEntities ids
    _.log urls, 'get many wikidata entities'
    promises_.all urls.map(getReq)
    .then mergeResults

  else
    url = getEntities(ids)
    getReq url
    .get 'entities'

# Limiting arguments to strictly 1
getReq = (url)-> promises_.get url
mergeResults = (results)-> _.extend.apply _, results.map(_.property('entities'))

# Expose a single requester
# Taking a Wikidata Id
# Returning the corresponding entity object
module.exports = requestGrouper { requester, delay: 5 }
