// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Dataseed is a blackboxed service getting some basic facts on books from the web
// it is closed source as possibly in a legal grey zone
// It's a placeholder to make search results within inventaire acceptable
// while entities created internally ramp up toward getting us autonomous
// Its place should be progressively decreased until complete removal

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const requests_ = __.require('lib', 'requests')
const isbn_ = __.require('lib', 'isbn/isbn')

const { enabled, host } = CONFIG.dataseed

module.exports = {
  getByIsbns: (isbns, refresh) => {
    isbns = _.forceArray(isbns)
    if (!enabled) return promises_.resolve(isbns.map(emptySeed))
    isbns = isbns.join('|')
    return requests_.get(_.buildPath(`${host}/books`, { isbns, refresh }))
  },

  // Provides simply an image in a prompt maner
  getImageByIsbn: isbn => {
    isbn = isbn_.toIsbn13(isbn)
    if (!isbn) return promises_.reject(new Error('invalid isbn'))
    return requests_.get(_.buildPath(`${host}/images`, { isbn }))
  },

  // Converts the url to an image hash
  getImageByUrl: url => {
    url = encodeURIComponent(url)
    return requests_.get(_.buildPath(`${host}/images`, { url }))
  }
}

const emptySeed = isbn => ({
  isbn
})
