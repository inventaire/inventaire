/* eslint-disable
    implicit-arrow-linebreak,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const wpBase = 'https://en.wikipedia.org/w/api.php'
const apiBase = `${wpBase}?action=query&prop=pageimages&format=json&titles=`
const error_ = __.require('lib', 'error/error')

module.exports = title => {
  title = _.fixedEncodeURIComponent(title)
  const url = `${apiBase}${title}`

  return requests_.get(url)
  .then(res => {
    const { pages } = res.query
    const source = __guard__(__guard__(_.values(pages)[0], x1 => x1.thumbnail), x => x.source)
    if (source != null) {
      return parseThumbUrl(source)
    } else {
      throw error_.notFound(title)
    }
  })
  .then(url => ({
    url,

    credits: {
      text: 'English Wikipedia',
      url: `https://en.wikipedia.org/wiki/${title}`
    }
  }))
}

// using the thumb fully built URL instead of build the URL
// from the filename md5 hash, making it less hazardous
const parseThumbUrl = url => // removing the last part and the thumb name
  url.split('/').slice(0, -1).join('/').replace('/thumb', '')

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
