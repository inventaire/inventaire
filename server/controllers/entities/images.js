// An endpoint to get entities images, directly from claims,
// or from sub-entities claims if considered better illustrations
// Ex: requesting images for a work, this endpoint would return images URLs
// from the work editions

// Primary use case: feed Elasticsearch documents with an 'images' object
// from which to pick the best illustration for live search results

const __ = require('config').universalPath
const sanitize = __.require('lib', 'sanitize/sanitize')
const error_ = __.require('lib', 'error/error')
const getEntitiesImages = require('./lib/get_entities_images')
const { img: imgUrlBuilder } = __.require('lib', 'emails/app_api')
const getThumbData = __.require('data', 'commons/thumb')

const sanitization = {
  uris: {},
  refresh: { optional: true },
  redirect: {
    generic: 'boolean',
    optional: true
  },
  width: {
    generic: 'positiveInteger',
    optional: true
  },
  height: {
    generic: 'positiveInteger',
    optional: true
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(async ({ uris, refresh, redirect, width, height }) => {
    if (redirect) {
      if (uris.length !== 1) {
        throw error_.new('only one URI is allowed in redirect mode', 400, req.query)
      }
    }

    const images = await getEntitiesImages(uris, refresh)

    if (redirect) {
      redirectToRawImage(res, uris[0], images, width, height)
    } else {
      res.json({ images })
    }
  })
  .catch(error_.Handler(req, res))
}

const redirectToRawImage = async (res, uri, images, width, height) => {
  const image = images[uri] && images[uri][0]
  if (image == null) {
    const err = error_.notFound({ uri })
    err.quiet = true
    throw err
  }

  const url = await replaceWikimediaFilename(image)

  res.redirect(imgUrlBuilder(url, width, height))
}

const replaceWikimediaFilename = async image => {
  // Wikimedia file name neither start by 'http' or '/'
  if (image.startsWith('http') || image[0] === '/') return image
  else return getThumbData(image).url
}
