__ = require('config').root
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
Promise = require 'bluebird'
osmosis = require 'osmosis'

module.exports = (req, res)->
  { file, width } = req.query

  unless file? then return error_.bundle res, 'missing file parameter', 400

  timespan = cache_.solveExpirationTime 'commons'

  key = "commons:#{file}:#{width}"
  cache_.get key, requestThumb.bind(null, file, width), timespan
  .then res.json.bind(res)
  .catch error_.Handler(res)

requestThumb = (file, width)->
  url = "http://tools.wmflabs.org/magnus-toolserver/commonsapi.php?image=#{file}&thumbwidth=#{width}"

  def = Promise.defer()

  osmosis
  .get url
  .set
    thumbnail: 'thumbnail'
    error: 'error'
    author: 'author'
    license: 'license name'
  .data parseData.bind(null, def, file)

  return def.promise

parseData = (def, file, data)->
  { thumbnail, error, author } = data
  data.author = removeMarkups author

  unless thumbnail?
    err = new Error error
    if error.match('File does not exist') then err.status = 404
    def.reject err
    return

  unless _.validWmCommonsThumbnail file, thumbnail
    err = error_.new 'invalid thumbnail', 500, file, data
    def.reject err
    return

  def.resolve data


textInMarkups = /<.+>(.*)<\/\w+>/
removeMarkups = (text)->
  # avoiding very long credits
  # including whole html documents
  # cf: http://tools.wmflabs.org/magnus-toolserver/commonsapi.php?image=F%C3%A9lix_Nadar_1820-1910_portraits_Jules_Verne.jpg&thumbwidth=1000
  if text.length > 100
    _.warn 'discarding photo author credits: too long'
    return

  text = text?.replace textInMarkups, '$1'
  if text is '' then return
  else return text


validWmCommonsThumbnail = (file, thumbnail)->
  fileParts = extractWords file
  thumbnailParts = extractWords unescape(lastPart(thumbnail))
  ratio = _.matchesCount(fileParts, thumbnailParts) / fileParts.length
  valid = ratio > 0.5
  unless valid
    _.log arguments, 'not validWmCommonsThumbnail'
    _.log [fileParts, thumbnailParts], 'parts'
    _.log ratio, 'certitude ratio'
  return valid

lastPart = (url)-> url.split('/').slice(-1)[0]
extractWords = (str)-> str.split /\W|_/
