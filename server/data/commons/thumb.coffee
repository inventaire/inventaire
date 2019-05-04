CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
xml_ = __.require 'lib', 'xml'
qs = require 'querystring'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'
fullPublicHost = CONFIG.fullPublicHost()
# Defaulting to a high width as if the width is higher than the original,
# the API returns the original path
# But not too high though so that we don't get super heavy files
width = 2000

module.exports = (file)->
  key = "commons:#{file}:#{width}"
  cache_.get { key, fn: getThumbData.bind(null, file) }

getThumbData = (file)->
  file = qs.escape file
  requests_.get requestOptions(file, width)
  .then xml_.parse
  .then extractData
  # Known case:
  # - XML parse error due to invalid XML response
  #   Ex: "Logo der Schweizerischen Eidgenossenschaft.svg" response triggers a
  #   "No whitespace between attributes" error from the xml2js parser
  .catch fallback(file)
  .then formatData.bind(null, file)
  .catch _.ErrorRethrow('get commons image err')

commonsApiEndpoint = 'http://tools.wmflabs.org/magnus-toolserver/commonsapi.php'

requestOptions = (image, thumbwidth)->
  url: _.buildPath commonsApiEndpoint, { image, thumbwidth }
  headers:
    'Content-Type': 'application/xml'
    # the commonsapi requires a User-Agent
    'User-Agent': "#{fullPublicHost} server"

extractData = (res)->
  { file, licenses, error } = res.response
  return data =
    url: file?[0]?.urls?[0]?.thumbnail?[0]
    license: licenses?[0]?.license?[0]?.name?.toString()
    author: file?[0]?.author?.toString()
    error: error?[0]

formatData = (file, parsedData)->
  { url, error, author, license } = parsedData
  author = removeMarkups author

  unless url?
    errMessage = error or 'url not found'
    err = new Error errMessage
    if error.match('File does not exist') then err.statusCode = 404
    throw err

  if author? and license? then text = "#{author} - #{license}"
  else text = author or license or 'Wikimedia Commons'

  credits = { text, url: "https://commons.wikimedia.org/wiki/File:#{file}" }
  return { url, credits }

textInMarkups = /<.+>(.*)<\/\w+>/
removeMarkups = (text)->
  unless text? then return
  # avoiding very long credits
  # including whole html documents
  # cf: http://tools.wmflabs.org/magnus-toolserver/commonsapi.php?image=F%C3%A9lix_Nadar_1820-1910_portraits_Jules_Verne.jpg&thumbwidth=1000
  if text.length > 100
    _.warn 'discarding photo author credits: too long'
    return

  text = text.replace textInMarkups, '$1'
  if text is '' then return
  else return text

fallback = (file)-> (err)->
  _.warn err, 'commonsapi or xml parse error: ignoring'
  # Redirects to the desired resized image, but we miss credits
  return { url: "https://commons.wikimedia.org/wiki/Special:FilePath/#{file}?width=#{width}" }
