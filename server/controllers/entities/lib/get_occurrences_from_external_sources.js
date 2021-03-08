// A module to look for works labels occurrences in an author's external databases reference.
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('lib', 'utils/assert_types')
const getWikipediaArticle = __.require('data', 'wikipedia/get_article')
const getBnfAuthorWorksTitles = __.require('data', 'bnf/get_bnf_author_works_titles')
const getBnbAuthorWorksTitles = __.require('data', 'bnb/get_bnb_author_works_titles')
const getBneAuthorWorksTitles = __.require('data', 'bne/get_bne_author_works_titles')
const getSelibrAuthorWorksTitle = __.require('data', 'selibr/get_selibr_author_works_titles')
const getKjkAuthorWorksTitle = __.require('data', 'kjk/get_kjk_author_works_titles')
const getNdlAuthorWorksTitle = __.require('data', 'ndl/get_ndl_author_works_titles')
const getOlAuthorWorksTitles = __.require('data', 'openlibrary/get_ol_author_works_titles')
const getEntityByUri = require('./get_entity_by_uri')
const { normalizeTerm } = require('./terms_normalization')
const promises_ = __.require('lib', 'promises')

// - worksLabels: labels from works of an author suspected
//   to be the same as the wdAuthorUri author
// - worksLabelsLangs: those labels language, indicating which Wikipedia editions
//   should be checked
module.exports = (wdAuthorUri, worksLabels, worksLabelsLangs) => {
  assert_.string(wdAuthorUri)
  assert_.strings(worksLabels)
  assert_.strings(worksLabelsLangs)

  // get Wikipedia article title from URI
  return getEntityByUri({ uri: wdAuthorUri })
  .then(authorEntity => {
    // Known case: entities tagged as 'missing' or 'meta'
    if (authorEntity.sitelinks == null) return []

    return Promise.all([
      getWikipediaOccurrences(authorEntity, worksLabels, worksLabelsLangs),
      getBnfOccurrences(authorEntity, worksLabels),
      getOpenLibraryOccurrences(authorEntity, worksLabels),
      getBnbOccurrences(authorEntity, worksLabels),
      getBneOccurrences(authorEntity, worksLabels),
      getSelibrOccurrences(authorEntity, worksLabels),
      getKjkOccurrences(authorEntity, worksLabels),
      getNdlOccurrences(authorEntity, worksLabels)
    ])
  })
  .then(_.flatten)
  .then(_.compact)
  .catch(err => {
    _.error(err, 'has works labels occurrence err')
    return []
  })
}

const getWikipediaOccurrences = (authorEntity, worksLabels, worksLabelsLangs) => {
  return Promise.all(getMostRelevantWikipediaArticles(authorEntity, worksLabelsLangs))
  .then(promises_.map(createOccurrencesFromUnstructuredArticle(worksLabels)))
}

const getMostRelevantWikipediaArticles = (authorEntity, worksLabelsLangs) => {
  const { sitelinks, originalLang } = authorEntity

  return _.uniq(worksLabelsLangs.concat([ originalLang, 'en' ]))
  .map(lang => {
    const title = sitelinks[`${lang}wiki`]
    if (title) return { lang, title }
  })
  .filter(_.identity)
  .map(getWikipediaArticle)
}

const getAndCreateOccurrencesFromIds = (prop, getWorkTitlesFn) => (authorEntity, worksLabels) => {
  // An author should normally have only 1 value per external id property
  // but if there are several, check every available ids
  const ids = authorEntity.claims[prop]
  if (ids == null) return
  return Promise.all(ids.map(getWorkTitlesFn))
  .then(_.flatten)
  .then(promises_.map(createOccurrencesFromExactTitles(worksLabels)))
}

const getBnfOccurrences = getAndCreateOccurrencesFromIds('wdt:P268', getBnfAuthorWorksTitles)
const getOpenLibraryOccurrences = getAndCreateOccurrencesFromIds('wdt:P648', getOlAuthorWorksTitles)
const getBnbOccurrences = getAndCreateOccurrencesFromIds('wdt:P5361', getBnbAuthorWorksTitles)
const getBneOccurrences = getAndCreateOccurrencesFromIds('wdt:P950', getBneAuthorWorksTitles)
const getSelibrOccurrences = getAndCreateOccurrencesFromIds('wdt:P906', getSelibrAuthorWorksTitle)
const getKjkOccurrences = getAndCreateOccurrencesFromIds('wdt:P1006', getKjkAuthorWorksTitle)
const getNdlOccurrences = getAndCreateOccurrencesFromIds('wdt:P349', getNdlAuthorWorksTitle)

const createOccurrencesFromUnstructuredArticle = worksLabels => {
  const worksLabelsPattern = new RegExp(worksLabels.join('|'), 'gi')
  return article => {
    const matchedTitles = _.uniq(article.extract.match(worksLabelsPattern))
    if (matchedTitles.length <= 0) return
    return { url: article.url, matchedTitles, structuredDataSource: false }
  }
}

const createOccurrencesFromExactTitles = worksLabels => result => {
  const title = normalizeTerm(result.title)
  if (worksLabels.includes(title)) {
    return {
      url: result.url,
      matchedTitles: [ title ],
      structuredDataSource: true
    }
  }
}
