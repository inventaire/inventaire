CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
mediaStorageEndpoint = CONFIG.mediaStorage.images.internalEndpoint()
responses_ = __.require 'lib', 'responses'
getResizedImage = require './lib/get_resized_image'
{ offline, imageRedirection } = CONFIG
containersList = Object.keys __.require('controllers', 'images/lib/containers')

# resized images urls looks like
# /img/#{container}/#{w}x#{h}/(#{hash}(.jpg)?|#{external url hashCode?href=escaped url})"

exports.get = (req, res, next)->
  # can be useful in development
  if offline
    message = 'you are in offline mode: no img delivered'
    return responses_.okWarning res, 'connection', message

  # Used to redirect to production server when working with the prod databases
  # in development
  if imageRedirection
    { originalUrl } = req
    res.redirect imageRedirection + originalUrl
    return

  [ container, dimensions, rest ] = parseReq req

  unless container in containersList
    return error_.bundleInvalid req, res, 'container', container

  # if no dimensions are passed, should return the maximum dimension
  unless /\d{2,4}x\d{2,4}/.test dimensions
    rest = dimensions
    dimensions = null

  if /^[0-9a-f]{40}(.jpg)?$/.test rest
    url = "#{mediaStorageEndpoint}#{container}/#{rest}"

  else if /^[0-9]+$/.test rest
    url = req.query.href
    unless _.isUrl url
      return error_.bundle req, res, 'invalid href query', 400, url

    urlCode = _.hashCode(url).toString()
    # The hashcode can be used by Nginx for caching, while the url is passed
    # as query argument in case it isnt in cache.
    # Here, we just check that we do get the same hash
    unless urlCode is rest
      return error_.bundle req, res, 'hash code and href dont match', 400

  else
    return error_.bundle req, res, 'invalid image path', 400, rest

  getResizedImage req, res, url, dimensions

parseReq = (req)->
  { pathname } = req._parsedUrl
  pathname = pathname.replace '/img/', ''
  return pathname.split '/'
