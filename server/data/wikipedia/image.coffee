__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
apiBase = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=images&titles="
imageBase = "https://upload.wikimedia.org/wikipedia/en"
{ md5 } = __.require 'lib', 'crypto'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
fuzzy = require 'fuzzy.js'
iconsBlacklist = require './icons_blacklist'

module.exports = (req, res)->
  { query } = req
  { title } = query

  unless title?.length > 0
    return error_.bundle res, 'missing title', 400, query

  key = "enwpimage:#{title}"
  cache_.get key, requestImage.bind(null, title)
  .then _.Log('wp image url')
  .then (url)-> res.json {url: url}
  .catch error_.Handler(res)

requestImage = (title)->
  _.log title, 'title'
  raw = unUnderscorize title
  underscored = underscorize title

  url = "#{apiBase}#{underscored}"

  _.log url, "enwpimage:#{title}"

  promises_.get url
  .then (data)->
    { pages } = data.query
    unless pages? then throw error_.notFound data
    page = _.findWhere pages, {title: raw}
    unless page?.images?.length > 0 then throw error_.notFound data

    filenames = page.images.map (img)-> img.title?.replace 'File:', ''
    filename = pickBestImage title, filenames

    unless filename? then throw error_.notFound data

    return getUrl filename

  .catch (err)->
    _.inspect err, "enwpimage #{title} err"
    throw err

unUnderscorize = (text)-> text.replace /_/g, ' '
underscorize = (text)-> text.replace /\s/g, '_'

pickBestImage = (title, images)->
  images = excludeIcons images
  switch images.length
    when 0 then return
    when 1 then return images[0]
    else
      score = MatchingScore title
      return _.max images, score

excludeIcons = (images)->
  images.filter (img)->
    if /svg$/.test img then return false
    if img in iconsBlacklist then return false
    return true

MatchingScore = (a)->
  fn = (b)->
    score = fuzzy(a, b).score
    return _.log score, "#{a} --VS-- #{b}"

getUrl = (filename)->
  filename = underscorize filename
  _.log filename, 'filename'
  hash = md5 filename
  _.log hash, 'hash'
  [ a, b ] = hash
  # DO NOT encode the filename before hashing
  filename = encodeURIComponent filename
  url = "#{imageBase}/#{a}/#{a}#{b}/#{filename}"
  _.log url, 'url'
