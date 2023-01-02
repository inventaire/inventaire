// An endpoint to get entities images, directly from claims,
// or from sub-entities claims if considered better illustrations
// Ex: requesting images for a work, this endpoint would return images URLs
// from the work editions

// Primary use case: feed Elasticsearch documents with an 'images' object
// from which to pick the best illustration for live search results

import { sanitize, validateSanitization } from '#lib/sanitize/sanitize'
import error_ from '#lib/error/error'
import { img as imgUrlBuilder } from '#lib/emails/app_api'
import getThumbData from '#data/commons/thumb'
import getEntitiesImages from './lib/get_entities_images.js'

const sanitization = validateSanitization({
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
})

export default async (req, res) => {
  const { uris, refresh, redirect, width, height } = sanitize(req, res, sanitization)
  if (redirect) {
    if (uris.length !== 1) {
      throw error_.new('only one URI is allowed in redirect mode', 400, req.query)
    }
  }

  const images = await getEntitiesImages(uris, refresh)

  if (redirect) {
    const url = await findRawImage(uris[0], images, width, height)
    res.redirect(url)
  } else {
    res.json({ images })
  }
}

const findRawImage = async (uri, images, width, height) => {
  const image = images[uri] && images[uri][0]
  if (image == null) {
    const err = error_.notFound({ uri })
    err.quiet = true
    throw err
  }

  const url = await replaceWikimediaFilename(image)

  return imgUrlBuilder(url, width, height)
}

const replaceWikimediaFilename = async image => {
  // Wikimedia file name neither start by 'http' or '/'
  if (image.startsWith('http') || image[0] === '/') return image
  else return getThumbData(image).url
}
