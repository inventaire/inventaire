CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
cache_ = __.require 'lib', 'cache'

endpoint = 'https://openlibrary.org'
base = "#{endpoint}/search.json"
headers = { accept: '*/*' }

module.exports = (olId, worksTitles)->
  # Todo set cache base on getBnfAuthorWorksTitles
  # key = "ol:author-works-titles:#{olId}"
  # return cache_.get { key, fn: getAuthorWorksTitles.bind(null, olId, worksTitles) }
  { Promise } = __.require 'lib', 'promises'
  return Promise.resolve getAuthorWorksTitles(olId, worksTitles)

getAuthorWorksTitles = (olId, worksTitles)->
  _.info olId, 'olId'
  Promise.all worksTitles.map (workTitle)->
    url = base + "?title=#{workTitle}&format=json"
    requests_.get({ url, headers })
    .then (res)->
      res.docs
      .filter (doc)->
        _.includes doc.author_key, olId
      .map (result)->
        quotation: result.title_suggest
        url: endpoint + result.key
  .then _.flatten
