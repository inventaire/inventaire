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
module.exports = (file, width = 2000, refresh)->
  key = "commons:#{file}:#{width}"
  timespan = if refresh is true then 0 else null
  cache_.get { key, fn: getThumbData.bind(null, file, width), timespan }

getThumbData = (file, width = 2000)->
  file = qs.escape file
  requests_.get requestOptions(file, width)
  .then xml_.parse
  .then extractData
  .then formatData.bind(null, file)
  .catch _.ErrorRethrow('get commons image err')

# Note: Commons files could also be accessed directly from
# https://commons.wikimedia.org/wiki/Special:FilePath/#{file}?width=#{width}
requestOptions = (file, width)->
  url: _.buildPath 'http://tools.wmflabs.org/magnus-toolserver/commonsapi.php',
    image: file
    thumbwidth: width
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
  else text = author or license

  return data =
    url: url
    credits:
      text: text
      url: "https://commons.wikimedia.org/wiki/File:#{file}"

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
