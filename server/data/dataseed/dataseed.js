// Dataseed is a blackboxed service getting some basic facts on books from the web
// it is closed source as possibly in a legal grey zone
// It's a placeholder to make search results within inventaire acceptable
// while entities created internally ramp up toward getting us autonomous
// Its place should be progressively decreased until complete removal

import CONFIG from 'config'
import _ from '#builders/utils'
import requests_ from '#lib/requests'
import isbn_ from '#lib/isbn/isbn'
import { buildUrl } from '#lib/utils/url'

const { enabled, origin } = CONFIG.dataseed

const reqOptions = { timeout: 60 * 1000 }
if (origin.startsWith('https')) reqOptions.ignoreCertificateErrors = true

export default {
  getByIsbns: async (isbns, refresh) => {
    isbns = _.forceArray(isbns)
    if (!enabled) return isbns.map(emptySeed)
    isbns = isbns.join('|')
    const url = buildUrl(`${origin}/books`, { isbns, refresh })
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
    const url = buildUrl(`${origin}/images`, { isbn })
    return requests_.get(url, reqOptions)
  },

  cleanupImageUrl: imageUrl => {
    const url = buildUrl(`${origin}/images`, { url: imageUrl })
    return requests_.get(url, reqOptions)
  }
}

const emptySeed = isbn => ({ isbn })
