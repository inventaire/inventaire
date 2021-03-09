// Dataseed is a blackboxed service getting some basic facts on books from the web
// it is closed source as possibly in a legal grey zone
// It's a placeholder to make search results within inventaire acceptable
// while entities created internally ramp up toward getting us autonomous
// Its place should be progressively decreased until complete removal

const _ = require('builders/utils')
const requests_ = require('lib/requests')
const isbn_ = require('lib/isbn/isbn')

const { enabled, host } = require('config').dataseed
const reqOptions = { timeout: 60 * 1000 }
if (host.startsWith('https')) reqOptions.selfSigned = true

module.exports = {
  getByIsbns: async (isbns, refresh) => {
    isbns = _.forceArray(isbns)
    if (!enabled) return isbns.map(emptySeed)
    isbns = isbns.join('|')
    const url = _.buildPath(`${host}/books`, { isbns, refresh })
    try {
      return await requests_.get(url, reqOptions)
    } catch (err) {
      _.error(err, 'dataseed getByIsbns err')
      return []
    }
  },

  // Provides simply an image in a prompt maner
  getImageByIsbn: async isbn => {
    if (!enabled || isbn == null) return {}
    isbn = isbn_.toIsbn13(isbn)
    if (!isbn) throw new Error('invalid isbn')
    const url = _.buildPath(`${host}/images`, { isbn })
    return requests_.get(url, reqOptions)
  },

  // Converts the url to an image hash
  getImageByUrl: imageUrl => {
    const url = _.buildPath(`${host}/images`, { url: encodeURIComponent(imageUrl) })
    return requests_.get(url, reqOptions)
  }
}

const emptySeed = isbn => ({ isbn })
