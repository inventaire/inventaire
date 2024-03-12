// Dataseed is a blackboxed service getting some basic facts on books from the web
// it is closed source as possibly in a legal grey zone
// It's a placeholder to make search results within inventaire acceptable
// while entities created internally ramp up toward getting us autonomous
// Its place should be progressively decreased until complete removal

import { toIsbn13 } from '#lib/isbn/isbn'
import { requests_ } from '#lib/requests'
import { forceArray } from '#lib/utils/base'
import { logError } from '#lib/utils/logs'
import { buildUrl } from '#lib/utils/url'
import CONFIG from '#server/config'
import type { Isbn } from '#types/entity'

const { enabled, origin } = CONFIG.dataseed

const reqOptions = {
  timeout: 60 * 1000,
  ignoreCertificateErrors: origin.startsWith('https'),
}

export async function getSeedsByIsbns (isbns: Isbn | Isbn[], refresh?: boolean) {
  isbns = forceArray(isbns)
  if (!enabled) return isbns.map(emptySeed)
  isbns = isbns.join('|')
  const url = buildUrl(`${origin}/books`, { isbns, refresh })
  try {
    return await requests_.get(url, reqOptions)
  } catch (err) {
    logError(err, 'dataseed getSeedsByIsbns err')
    return []
  }
}

// Provides simply an image in a prompt maner
export async function getImageByIsbn (isbn) {
  if (!enabled || isbn == null) return {}
  isbn = toIsbn13(isbn)
  if (!isbn) throw new Error('invalid isbn')
  const url = buildUrl(`${origin}/images`, { isbn })
  return requests_.get(url, reqOptions)
}

export function cleanupImageUrl (imageUrl) {
  const url = buildUrl(`${origin}/images`, { url: imageUrl })
  return requests_.get(url, reqOptions)
}

const emptySeed = isbn => ({ isbn })
