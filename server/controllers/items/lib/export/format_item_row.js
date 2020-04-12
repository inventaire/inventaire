const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { getNames } = require('../snapshot/helpers')
const host = CONFIG.fullPublicHost()

module.exports = lang => item => {
  const { _id, entity: uri, details, notes, created } = item
  const { edition, works, authors, series, genres, subjects, publisher } = item
  const { worksUris, authorsUris, seriesUris, genresUris, subjectsUris, publisherUri } = item

  const { isbn13h, isbn10h } = getIsbn(edition)
  const title = getTitle(edition, works)
  const subtitle = getFirstValue(edition, 'wdt:P1680')
  const publicationDate = getFirstValue(edition, 'wdt:P577')
  const cover = getCoverUrl(edition)

  const worksNames = getNames(lang, works)
  const seriesOrdinales = works.map(getWorkSeriesOrdinals).join('-')
  const authorsNames = getNames(lang, authors)
  const seriesNames = getNames(lang, series)
  const publisherName = publisher && getNames(lang, [ publisher ])
  const genresNames = getNames(lang, genres)
  const subjectsNames = getNames(lang, subjects)

  const createdTime = new Date(created).toISOString()

  return [
    _id,
    uri,
    isbn13h,
    isbn10h,
    title,
    subtitle,
    publicationDate,
    cover,
    worksUris,
    worksNames,
    seriesOrdinales,
    authorsUris,
    authorsNames,
    seriesUris,
    seriesNames,
    genresUris,
    genresNames,
    subjectsUris,
    subjectsNames,
    publisherUri,
    publisherName,
    details,
    notes,
    createdTime
  ].map(formatField).join(',')
}

const formatField = text => {
  if (!text) return ''
  if (_.isArray(text)) text = text.join(',')
  text = text.replace(/"/g, '""')
  if (text.match(/,/)) text = `"${text}"`
  return text
}

const getWorkSeriesOrdinals = work => work.claims['wdt:P1545']

const getIsbn = edition => {
  if (!edition) return {}
  const { claims } = edition
  let isbn13h, isbn10h
  if (claims['wdt:P212']) isbn13h = claims['wdt:P212'][0]
  if (claims['wdt:P957']) isbn10h = claims['wdt:P957'][0]
  return { isbn13h, isbn10h }
}

const getTitle = (edition, works) => {
  if (edition) return edition.claims['wdt:P1476'][0]
  else return getNames(works)
}

const getCoverUrl = edition => {
  const coverClaims = edition['invp:P2']
  if (coverClaims && coverClaims[0]) return `${host}${coverClaims[0]}`
}

const getFirstValue = (entity, property) => {
  if (entity.claims[property] != null) {
    return entity.claims[property][0]
  }
}
