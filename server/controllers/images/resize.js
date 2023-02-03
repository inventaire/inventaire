import CONFIG from 'config'
import _ from 'builders/utils'
import error_ from 'lib/error/error'
import responses_ from 'lib/responses'
import getResizedImage from './lib/get_resized_image'
import { URL } from 'node:url'
const { mode } = CONFIG.mediaStorage
const mediaStorageEndpoint = CONFIG.mediaStorage[mode].internalEndpoint()
const { offline } = CONFIG
const containersList = Object.keys(require('controllers/images/lib/containers').containers)

// resized images urls looks like
// /img/#{container}/#{w}x#{h}/(#{hash}|#{external url hashCode?href=escaped url})"

export default {
  get: (req, res) => {
    // can be useful in development
    if (offline) {
      const message = 'you are in offline mode: no img delivered'
      responses_.okWarning(res, 'connection', message)
      return
    }

    let [ container, dimensions, rest ] = parseReq(req)

    if (!containersList.includes(container)) {
      return error_.bundleInvalid(req, res, 'container', container)
    }

    // if no dimensions are passed, should return the maximum dimension
    if (!/\d{2,4}x\d{2,4}/.test(dimensions)) {
      rest = dimensions
      dimensions = null
    }

    let url
    if (/^[0-9a-f]{40}$/.test(rest) || (container === 'assets')) {
      url = `${mediaStorageEndpoint}${container}/${rest}`
    } else if (/^\d+$/.test(rest)) {
      url = req.query.href
      if (!_.isUrl(url)) {
        return error_.bundle(req, res, 'invalid href query', 400, url)
      }

      const { hostname } = new URL(url)

      if (!trustedRemoteHosts.has(hostname)) {
        return error_.bundle(req, res, 'image domain not allowed', 400, url)
      }

      const urlCode = _.hashCode(url).toString()
      // The hashcode can be used by Nginx for caching, while the url is passed
      // as query argument in case it isnt in cache.
      // Here, we just check that we do get the same hash
      if (urlCode !== rest) {
        return error_.bundle(req, res, 'hash code and href dont match', 400)
      }
    } else {
      return error_.bundle(req, res, 'invalid image path', 400, rest)
    }

    getResizedImage(req, res, url, dimensions)
  }
}

const parseReq = req => {
  let { pathname } = req._parsedUrl
  pathname = pathname.replace('/img/', '')
  return pathname.split('/')
}

const trustedRemoteHosts = new Set([
  'commons.wikimedia.org',
  'upload.wikimedia.org',
  'covers.openlibrary.org',
])
