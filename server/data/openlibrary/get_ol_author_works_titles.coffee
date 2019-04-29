CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'https://openlibrary.org'
base = "#{endpoint}/search.json"
headers = { accept: '*/*' }

module.exports = (olId, workLabels)->
  key = "ol:author-works-titles:#{olId}:#{workLabels}"
  return cache_.get { key, fn: getAuthorWorksTitles.bind(null, olId, workLabels), timespan: 3*oneMonth }

getAuthorWorksTitles = (olId, workLabels)->
  _.info olId, 'olId'
  url = base + "?author=#{olId}"
  requests_.get { url, headers }
  .then (res)->
    res.docs
    .filter (doc)-> _.intersection(doc.title_suggest, workLabels)
    .map (result)->
      quotation: result.title_suggest
      url: endpoint + result.key
