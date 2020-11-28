// An endpoint to get entities images, directly from claims,
// or from sub-entities claims if considered better illustrations
// Ex: requesting images for a work, this endpoint would return images URLs
// from the work editions

// Primary use case: feed ElasticSearch documents with an 'images' object
// from which to pick the best illustration for live search results

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const getEntitiesImages = require('./lib/get_entities_images')
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

  return getEntitiesImages(uris, refresh)
  .then(images => {
    if (redirect) {
      redirectToRawImage(res, uris[0], images, width, height)
    } else {
      res.json({ images })
    }
  })
  .catch(error_.Handler(req, res))
}

const redirectToRawImage = (res, uri, images, width, height) => {
  const image = images[uri] && images[uri][0]
  if (image == null) {
    const err = error_.notFound({ uri })
    err.quiet = true
    throw err
  }

  return replaceWikimediaFilename(image)
  .then(finalUrl => imgUrlBuilder(finalUrl, width, height))
  .then(res.redirect.bind(res))
}

const replaceWikimediaFilename = async image => {
  // Wikimedia file name neither start by 'http' or '/'
  if (image.startsWith('http') || image[0] === '/') return image
  else return getThumbData(image).url
}
