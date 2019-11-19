/* eslint-disable
    prefer-const,
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
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const xml_ = __.require('lib', 'xml')
const qs = require('querystring')
const cache_ = __.require('lib', 'cache')
const fullPublicHost = CONFIG.fullPublicHost()
// Defaulting to a high width as if the width is higher than the original,
// the API returns the original path
// But not too high though so that we don't get super heavy files
const width = 2000

module.exports = file => {
  const key = `commons:${file}:${width}`
  return cache_.get({ key, fn: getThumbData.bind(null, file) })
}

const getThumbData = file => {
  file = qs.escape(file)
  return requests_.get(requestOptions(file, width))
  .then(xml_.parse)
  .then(extractData)
  // Known case:
  // - XML parse error due to invalid XML response
  //   Ex: "Logo der Schweizerischen Eidgenossenschaft.svg" response triggers a
  //   "No whitespace between attributes" error from the xml2js parser
  .catch(fallback(file))
  .then(formatData.bind(null, file))
  .catch(_.ErrorRethrow('get commons image err'))
}

const commonsApiEndpoint = 'http://tools.wmflabs.org/magnus-toolserver/commonsapi.php'

const requestOptions = (image, thumbwidth) => ({
  url: _.buildPath(commonsApiEndpoint, { image, thumbwidth }),

  headers: {
    'Content-Type': 'application/xml',
    // the commonsapi requires a User-Agent
    'User-Agent': `${fullPublicHost} server`
  }
})

const extractData = res => {
  const { file, licenses, error } = res.response
  return {
    url: __guard__(__guard__(__guard__(__guard__(file != null ? file[0] : undefined, x3 => x3.urls), x2 => x2[0]), x1 => x1.thumbnail), x => x[0]),
    license: __guard__(__guard__(__guard__(__guard__(licenses != null ? licenses[0] : undefined, x7 => x7.license), x6 => x6[0]), x5 => x5.name), x4 => x4.toString()),
    author: __guard__(__guard__(file != null ? file[0] : undefined, x9 => x9.author), x8 => x8.toString()),
    error: (error != null ? error[0] : undefined)
  }
}

const formatData = (file, parsedData) => {
  let text
  let { url, error, author, license } = parsedData
  author = removeMarkups(author)

  if (url == null) {
    const errMessage = error || 'url not found'
    const err = new Error(errMessage)
    if (error.match('File does not exist')) { err.statusCode = 404 }
    throw err
  }

  if ((author != null) && (license != null)) {
    text = `${author} - ${license}`
  } else {
    text = author || license || 'Wikimedia Commons'
  }

  const credits = { text, url: `https://commons.wikimedia.org/wiki/File:${file}` }
  return { url, credits }
}

const textInMarkups = /<.+>(.*)<\/\w+>/
const removeMarkups = text => {
  if (text == null) return
  // avoiding very long credits
  // including whole html documents
  // cf: http://tools.wmflabs.org/magnus-toolserver/commonsapi.php?image=F%C3%A9lix_Nadar_1820-1910_portraits_Jules_Verne.jpg&thumbwidth=1000
  if (text.length > 100) {
    _.warn('discarding photo author credits: too long')
    return
  }

  text = text.replace(textInMarkups, '$1')
  if (text === '') {
  } else {
    return text
  }
}

const fallback = file => err => {
  _.warn(err, 'commonsapi or xml parse error: ignoring')
  // Redirects to the desired resized image, but we miss credits
  return { url: `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${width}` }
}

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
