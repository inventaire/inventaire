# An endpoint to get entities images, directly from claims,
# or from sub-entities claims if considered better illustrations
# Ex: requesting images for a work, this endpoint would return images URLs
# from the work editions

# Primary use case: feed ElasticSearch documents with an 'images' object
# from which to pick the best illustration for live search results

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByUris = require './lib/get_entities_by_uris'
specialEntityImagesGetter = require './lib/special_entity_images_getter'
getEntityImagesFromClaims = require './lib/get_entity_images_from_claims'
{ img:imgUrlBuilder } = __.require('lib', 'emails/app_api')
getThumbData = __.require 'data', 'commons/thumb'

module.exports = (req, res)->
  { uris, refresh, redirect, width, height } = req.query

  unless _.isNonEmptyString uris
    return error_.bundleMissingQuery req, res, 'uris'

  uris = uris.split '|'
  refresh = _.parseBooleanString refresh
  redirect = _.parseBooleanString redirect

  if redirect
    if uris.length isnt 1
      message = 'only one URI is allowed in redirect mode'
      return error_.bundle req, res, message, 400, req.query

    if width? and not _.isPositiveIntegerString(width)
      return error_.bundleInvalid req, res, 'width', width

    if height? and not _.isPositiveIntegerString(height)
      return error_.bundleInvalid req, res, 'height', height

  getEntitiesByUris { uris, refresh }
  .get 'entities'
  .then getEntitiesImages
  .then (images)->
    if redirect
      redirectToRawImage res, uris[0], images, width, height
    else
      res.json { images }
  .catch error_.Handler(req, res)

getEntitiesImages = (entities)->
  Promise.props Object.keys(entities).reduce(getEntityImages(entities), {})

getEntityImages = (entities)-> (promises, id)->
  entity = entities[id]
  # All entities type that don't have a specialEntityImagesGetter will
  # simply return their first wdt:P18 claim value, if any
  getter = specialEntityImagesGetter[entity.type] or getEntityImagesFromClaims
  promises[id] = getter entity
  return promises

redirectToRawImage = (res, uri, images, width, height)->
  image = images[uri]?[0]
  unless image?
    err = error_.notFound { uri }
    err.quiet = true
    throw err

  replaceWikimediaFilename image
  .then (finalUrl)-> imgUrlBuilder finalUrl, width, height
  .then res.redirect.bind(res)

replaceWikimediaFilename = (image)->
  # Wikimedia file name neither start by 'http' or '/'
  if not /^(http|\/)/.test(image)
    getThumbData(image).get 'url'
  else
    Promise.resolve image
