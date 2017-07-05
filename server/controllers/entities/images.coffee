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
getEntityImageClaims = require './lib/get_entity_image_claims'

module.exports = (req, res)->
  { uris } = req.query

  unless _.isNonEmptyString uris
    return error_.bundleMissingQuery req, res, 'uris'

  uris = uris.split '|'

  getEntitiesByUris uris
  .get 'entities'
  .then getEntitiesImages
  .then _.Wrap(res, 'images')
  .catch error_.Handler(req, res)

getEntitiesImages = (entities)->
  Promise.props Object.keys(entities).reduce(getEntityImages(entities), {})

getEntityImages = (entities)-> (promises, id)->
  entity = entities[id]
  # All entities type that don't have a specialEntityImagesGetter will
  # simply return their first wdt:P18 claim value, if any
  getter = specialEntityImagesGetter[entity.type] or getEntityImageClaims
  promises[id] = getter entity
  return promises
