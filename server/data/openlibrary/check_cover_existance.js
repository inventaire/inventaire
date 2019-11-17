// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const requests_ = __.require('lib', 'requests')
const error_ = __.require('lib', 'error/error')

module.exports = url => requests_.head(url)
.then(checkHeader.bind(null, url))

const checkHeader = (url, res) => {
  const contentType = res.headers['content-type']
  // Coupled with OpenLibrary response headers
  if ((contentType != null) && (contentType === 'image/jpeg')) {
    return url
  } else {
    throw error_.new('cover not found', 404, url)
  }
}
