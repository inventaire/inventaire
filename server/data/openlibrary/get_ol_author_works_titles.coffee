CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'https://openlibrary.org'
base = "#{endpoint}/search.json"
headers = { accept: '*/*' }

module.exports = (olId)->
  key = "ol:author-works-titles:#{olId}"
  return cache_.get { key, fn: getAuthorWorksTitles.bind(null, olId), timespan: 3*oneMonth }

getAuthorWorksTitles = (olId)->
  _.info olId, 'olId'
  url = base + "?author=#{olId}"
  requests_.get { url, headers }
  .then (res)->
    res.docs
    .map (result)->
      quotation: result.title_suggest
      url: endpoint + result.key
