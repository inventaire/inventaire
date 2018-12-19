__ = require('config').universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
wpBase = 'https://en.wikipedia.org/w/api.php'
apiBase = "#{wpBase}?action=query&prop=pageimages&format=json&titles="
error_ = __.require 'lib', 'error/error'

module.exports = (title)->
  title = _.fixedEncodeURIComponent title
  url = "#{apiBase}#{title}"

  requests_.get url
  .then (res)->
    { pages } = res.query
    source = _.values(pages)[0]?.thumbnail?.source
    if source? then return parseThumbUrl source
    else throw error_.notFound title
  .then (url)->
    url: url
    credits:
      text: 'English Wikipedia'
      url: "https://en.wikipedia.org/wiki/#{title}"

underscorize = (text)-> text.replace /\s/g, '_'

# using the thumb fully built URL instead of build the URL
# from the filename md5 hash, making it less hazardous
parseThumbUrl = (url)->
  # removing the last part and the thumb name
  return url.split('/')[0...-1].join('/').replace('/thumb', '')
