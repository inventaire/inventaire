CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
endpoint = CONFIG.images.localEndpoint()
{ maxSize } = CONFIG.images
request = require 'request'
qs = require 'querystring'
{ oneYear } =  __.require 'lib', 'times'
{ offline } = CONFIG

# resized images urls looks like /img/#{w}x#{h}/(#{hash}.jpg|#{external url hashCode?href=escaped url})"

module.exports = (req, res, next)->
  # could be useful in development
  # while hereafter image streams' error
  # aren't correctly handled
  if offline then return res.send()
  [ dimensions, rest ] = parseReq req

  # if no dimensions are passed, should return the maximum dimension
  unless /\d{2,4}x\d{2,4}/.test dimensions
    rest = dimensions
    dimensions = null

  if /^[0-9a-f]{40}.jpg$/.test rest
    url = "#{endpoint}#{rest}"

  else if /^[0-9]+$/.test rest
    url = req.query.href
    unless _.isUrl url
      return error_.bundle res, 'invalid href query', 400

    urlCode = _.hashCode(url).toString()
    # the hashcode can be used by nginx for caching
    # while the url is passed as query argument in case
    # it isnt in cache
    # here, we just check that we do get the same hash
    unless urlCode is rest
      return error_.bundle res, 'hash code and href dont match', 400

  else
    return error_.bundle res, 'invalid image path', 400, rest

  getResizeImage res, url, dimensions

getResizeImage = (res, url, dimensions)->
  [ width, height ] = dimensions?.split('x') or [maxSize, maxSize]
  [ width, height ] = images_.applyLimits width, height

  res.header 'Content-Type', 'image/jpeg'
  res.header 'Cache-Control', "public, max-age=#{oneYear}"

  images_.shrinkStream request(url), width, height
  .stream (err, stdout, stderr)->
    if err? then return error_.handler res, err
    stdout.pipe res
    stdout.on 'error', error_.Handler(res)
  # .catch error_.Handler(res)

parseReq = (req)->
  { pathname } = req._parsedUrl
  pathname = pathname.replace '/img/', ''
  return pathname.split '/'
