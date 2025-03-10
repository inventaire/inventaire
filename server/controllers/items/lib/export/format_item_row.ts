import { isArray } from '#lib/boolean_validations'
import { publicOrigin } from '#server/config'
import { getNames } from '../snapshot/helpers.js'

export default lang => item => {
  const { _id, entity: uri, details, notes, shelfNames, created, visibility, transaction } = item
  const { edition, works, authors, translators, series, genres, subjects, publisher, editionLang, originalLangs } = item
  const { worksUris, authorsUris, seriesUris, genresUris, subjectsUris, publisherUri, translatorsUris } = item

  const { isbn13h, isbn10h } = getIsbn(edition)
  const title = getTitle(lang, edition, works)
  const subtitle = getFirstValue(edition, 'wdt:P1680')
  const publicationDate = getFirstValue(edition, 'wdt:P577')
  const cover = getCoverUrl(edition)

  const worksNames = getNames(lang, works)
  const seriesOrdinales = works.map(getWorkSeriesOrdinals).join('-')
  const authorsNames = getNames(lang, authors)
  const seriesNames = getNames(lang, series)
  const publisherName = publisher && getNames(lang, [ publisher ])
  const translatorsNames = translators && getNames(lang, translators)
  const editionLangLabel = editionLang && (editionLang.labels[lang] || editionLang.labels.en)
  const originalLangsLabel = getNames(lang, originalLangs)
  const pagesCountNum = getFirstValue(edition, 'wdt:P1104')
  const pagesCount = pagesCountNum && pagesCountNum.toString()
  const genresNames = getNames(lang, genres)
  const subjectsNames = getNames(lang, subjects)

  const createdTime = new Date(created).toISOString()

  // Array order coupled with server/controllers/items/export.js header
  return [
    generateUrl(`/items/${_id}`),
    details,
    notes,
    visibility.join(','),
    transaction,
    createdTime,
    shelfNames,
    // NB: the item.entity might actually be a work for legacy reasons
    // but that should be a minor occurrence
    generateEntityUrl(uri),
    isbn13h,
    isbn10h,
    title,
    subtitle,
    publicationDate,
    cover,
    pagesCount,
    editionLangLabel,
    generateEntitiesUrls(worksUris),
    worksNames,
    originalLangsLabel,
    seriesOrdinales,
    generateEntitiesUrls(authorsUris),
    authorsNames,
    translatorsNames,
    generateEntitiesUrls(translatorsUris),
    generateEntitiesUrls(seriesUris),
    seriesNames,
    generateEntitiesUrls(genresUris),
    genresNames,
    generateEntitiesUrls(subjectsUris),
    subjectsNames,
    generateEntityUrl(publisherUri),
    publisherName,
  ].map(formatField).join(',')
}

function formatField (text) {
  if (!text) return ''
  if (isArray(text)) text = text.join(',')
  if (text.includes('"')) {
    // Escaping double quotes
    // See https://tools.ietf.org/html/rfc4180#section-2
    text = text.replaceAll('"', '""')
    text = `"${text}"`
  } else if (text.includes(',')) {
    // Quoting text that contains a comma to prevent it
    // to be interpreted as a field separator
    text = `"${text}"`
  }
  return text
}

const getWorkSeriesOrdinals = work => work.claims['wdt:P1545']

function getIsbn (edition) {
  if (!edition) return {}
  return {
    isbn13h: getFirstValue(edition, 'wdt:P212'),
    isbn10h: getFirstValue(edition, 'wdt:P957'),
  }
}

function getTitle (lang, edition, works) {
  if (edition) return getFirstValue(edition, 'wdt:P1476')
  else return getNames(lang, works)
}

function getCoverUrl (edition) {
  const coverPath = getFirstValue(edition, 'invp:P2')
  if (coverPath) return generateUrl(`/img/entities/${coverPath}`)
}

function getFirstValue (entity, property) {
  if (!entity) return
  const propertyClaims = entity.claims[property]
  if (propertyClaims != null) return propertyClaims[0]
}

function generateUrl (path) {
  if (path != null) return `${publicOrigin}${path}`
}

function generateEntityUrl (uri) {
  if (uri != null) return generateUrl(`/entity/${uri}`)
}

function generateEntitiesUrls (uris) {
  if (uris && uris.length > 0) return uris.map(generateEntityUrl).join(',')
}
