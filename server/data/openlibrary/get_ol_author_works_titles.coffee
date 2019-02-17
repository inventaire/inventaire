CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
cache_ = __.require 'lib', 'cache'

endpoint = 'https://openlibrary.org'
base = "#{endpoint}/search.json"
headers = { accept: '*/*' }

module.exports = (olId, workTitle)->
  key = "ol:author-works-titles:#{olId}"
  return cache_.get { key, fn: getAuthorWorksTitles.bind(null, olId, workTitle) }

getAuthorWorksTitles = (olId, workTitle)->
  _.info olId, 'olId'
  url = base + "?title=#{workTitle}&format=json"
  requests_.get { url, headers }
  .then (res)->
    res.docs.filter (doc)-> _.includes(doc.author_key, olId)
    .map (result)->
      quotation: result.title_suggest
      url: endpoint + result.key
