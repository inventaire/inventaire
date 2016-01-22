__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
wpBase = "https://en.wikipedia.org/w/api.php"
apiBase = "#{wpBase}?action=query&prop=pageimages&format=json&titles="
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res)->
  { query } = req
  { title, refresh } = query

  unless title?.length > 0
    return error_.bundle res, 'missing title', 400, query

  # Invalid the cache by passing refresh=true in the query.
  # Return null if refresh isn't truthy to let the cache set its default value
  timespan = if refresh then 0 else null

  key = "enwpimage:#{title}"
  cache_.get key, requestImage.bind(null, title), timespan
  .then _.Log('wp image url')
  .then (url)-> res.json {url: url}
  .catch error_.Handler(res)

requestImage = (title)->
  url = "#{apiBase}#{title}"
  _.log url, 'url'

  promises_.get url
  .then _.Inspect('requestImage')
  .then (res)->
    { pages } = res.query
    source = _.values(pages)[0]?.thumbnail?.source
    if source? then return parseThumbUrl source

underscorize = (text)-> text.replace /\s/g, '_'

# using the thumb fully built URL instead of build the URL
# from the filename md5 hash, making it less hazardous
parseThumbUrl = (url)->
  # removing the last part and the thumb name
  return url.split('/')[0...-1].join('/').replace('/thumb', '')
