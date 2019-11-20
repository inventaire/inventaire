/* eslint-disable
    prefer-const,
*/

// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// An endpoint to get entities images, directly from claims,
// or from sub-entities claims if considered better illustrations
// Ex: requesting images for a work, this endpoint would return images URLs
// from the work editions

// Primary use case: feed ElasticSearch documents with an 'images' object
// from which to pick the best illustration for live search results

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { Promise } = __.require('lib', 'promises')
const getEntitiesByUris = require('./lib/get_entities_by_uris')
const specialEntityImagesGetter = require('./lib/special_entity_images_getter')
const getEntityImagesFromClaims = require('./lib/get_entity_images_from_claims')
const { img: imgUrlBuilder } = __.require('lib', 'emails/app_api')
const getThumbData = __.require('data', 'commons/thumb')

module.exports = (req, res) => {
  let { uris, refresh, redirect, width, height } = req.query

  if (!_.isNonEmptyString(uris)) {
    return error_.bundleMissingQuery(req, res, 'uris')
  }

  uris = uris.split('|')
  refresh = _.parseBooleanString(refresh)
  redirect = _.parseBooleanString(redirect)

  if (redirect) {
    if (uris.length !== 1) {
      const message = 'only one URI is allowed in redirect mode'
      return error_.bundle(req, res, message, 400, req.query)
    }

    if ((width != null) && !_.isPositiveIntegerString(width)) {
      return error_.bundleInvalid(req, res, 'width', width)
    }

    if ((height != null) && !_.isPositiveIntegerString(height)) {
      return error_.bundleInvalid(req, res, 'height', height)
    }
  }

  return getEntitiesByUris({ uris, refresh })
  .get('entities')
  .then(getEntitiesImages)
  .then(images => {
    if (redirect) {
      return redirectToRawImage(res, uris[0], images, width, height)
    } else {
      return res.json({ images })
    }
  })
  .catch(error_.Handler(req, res))
}

const getEntitiesImages = entities => Promise.props(Object.keys(entities).reduce(getEntityImages(entities), {}))

const getEntityImages = entities => (promises, id) => {
  const entity = entities[id]
  // All entities type that don't have a specialEntityImagesGetter will
  // simply return their first wdt:P18 claim value, if any
  const getter = specialEntityImagesGetter[entity.type] || getEntityImagesFromClaims
  promises[id] = getter(entity)
  return promises
}

const redirectToRawImage = (res, uri, images, width, height) => {
  const image = images[uri] != null ? images[uri][0] : undefined
  if (image == null) {
    const err = error_.notFound({ uri })
    err.quiet = true
    throw err
  }

  return replaceWikimediaFilename(image)
  .then(finalUrl => imgUrlBuilder(finalUrl, width, height))
  .then(res.redirect.bind(res))
}

const replaceWikimediaFilename = image => {
  // Wikimedia file name neither start by 'http' or '/'
  if (!/^(http|\/)/.test(image)) {
    return getThumbData(image).get('url')
  } else {
    return Promise.resolve(image)
  }
}
