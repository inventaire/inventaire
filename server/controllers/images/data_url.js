/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Get an image data-url from a URL

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const breq = require('bluereq')
const host = CONFIG.fullPublicHost()

module.exports = (req, res, next) => {
  let { url } = req.query

  if (url == null) return error_.bundleMissingQuery(req, res, 'url')

  url = decodeURIComponent(url)
  if (url[0] === '/') { url = host + url }

  if (!_.isUrl(url)) return error_.bundleInvalid(req, res, 'url', url)

  return getImageDataUrl(url)
  .then(responses_.Wrap(res, 'data-url'))
  .catch(error_.Handler(req, res))
}

const getImageDataUrl = url => // Set encoding as null to get the response as a buffer
// see https://stackoverflow.com/a/17133012/3324977
  breq.get({ url, encoding: null })
.then(res => {
  const contentType = res.headers['content-type']

  if (contentType.split('/')[0] !== 'image') {
    throw error_.new('invalid content type', 400, url, contentType)
  }

  const buffer = new Buffer(res.body).toString('base64')
  return `data:${contentType};base64,${buffer}`
})
