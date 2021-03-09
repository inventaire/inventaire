const CONFIG = require('config')
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { mode } = CONFIG.mediaStorage
const mediaStorageEndpoint = CONFIG.mediaStorage[mode].internalEndpoint()
const responses_ = require('lib/responses')
const getResizedImage = require('./lib/get_resized_image')
const { offline } = CONFIG
const containersList = Object.keys(require('controllers/images/lib/containers'))
const { URL } = require('url')

// resized images urls looks like
// /img/#{container}/#{w}x#{h}/(#{hash}|#{external url hashCode?href=escaped url})"

module.exports = {
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
    } else if (/^[0-9]+$/.test(rest)) {
      url = req.query.href
      if (!_.isUrl(url)) {
        return error_.bundle(req, res, 'invalid href query', 400, url)
      }

      const { hostname } = new URL(url)

      if (denylistedRemoteHosts.includes(hostname)) {
        return error_.bundle(req, res, 'denylisted domain', 400, url)
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

const denylistedRemoteHosts = [
  // Returns ENOTFOUND errors
  'avatars.io'
]
