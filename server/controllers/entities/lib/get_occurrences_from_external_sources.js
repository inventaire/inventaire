// A module to look for works labels occurrences in an author's external databases reference.
const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const getWikipediaArticle = require('data/wikipedia/get_article')
const getBnfAuthorWorksTitles = require('data/bnf/get_bnf_author_works_titles')
// BNB SPARQL service is currently suspended, see https://bnb.data.bl.uk/sparql:
// "The Linked Open BNB is moving to a new home in Spring 2022"
// const getBnbAuthorWorksTitles = require('data/bnb/get_bnb_author_works_titles')
const getBneAuthorWorksTitles = require('data/bne/get_bne_author_works_titles')
const getGndAuthorWorksTitles = require('data/gnd/get_gnd_author_works_titles')
const getSelibrAuthorWorksTitle = require('data/selibr/get_selibr_author_works_titles')
const getKjkAuthorWorksTitle = require('data/kjk/get_kjk_author_works_titles')
const getNdlAuthorWorksTitle = require('data/ndl/get_ndl_author_works_titles')
const getOlAuthorWorksTitles = require('data/openlibrary/get_ol_author_works_titles')
const getEntityByUri = require('./get_entity_by_uri')
const { normalizeTerm } = require('./terms_normalization')
const { isWdEntityUri } = require('lib/boolean_validations')

// - worksLabels: labels from works of an author suspected
//   to be the same as the wdAuthorUri author
// - worksLabelsLangs: those labels language, indicating which Wikipedia editions
//   should be checked
module.exports = async (wdAuthorUri, worksLabels, worksLabelsLangs) => {
  assert_.string(wdAuthorUri)
  assert_.strings(worksLabels)
  assert_.strings(worksLabelsLangs)

  if (!isWdEntityUri(wdAuthorUri)) return []

  // get Wikipedia article title from URI
  const authorEntity = await getEntityByUri({ uri: wdAuthorUri })
  // Known case: entities tagged as 'missing' or 'meta'
  if (authorEntity.sitelinks == null) return []

  try {
    const occurrences = await Promise.all([
      getWikipediaOccurrences(authorEntity, worksLabels, worksLabelsLangs),
      getBnfOccurrences(authorEntity, worksLabels),
      getOpenLibraryOccurrences(authorEntity, worksLabels),
      // getBnbOccurrences(authorEntity, worksLabels),
      getBneOccurrences(authorEntity, worksLabels),
      getGndOccurrences(authorEntity, worksLabels),
      getSelibrOccurrences(authorEntity, worksLabels),
      getKjkOccurrences(authorEntity, worksLabels),
      getNdlOccurrences(authorEntity, worksLabels)
    ])
    return _.compact(occurrences.flat())
  } catch (err) {
    _.error(err, 'has works labels occurrence err')
    return []
  }
}

const getWikipediaOccurrences = async (authorEntity, worksLabels, worksLabelsLangs) => {
  const articles = await getMostRelevantWikipediaArticles(authorEntity, worksLabelsLangs)
  return Promise.all(articles.map(createOccurrencesFromUnstructuredArticle(worksLabels)))
}

const getMostRelevantWikipediaArticles = (authorEntity, worksLabelsLangs) => {
  const { sitelinks, originalLang } = authorEntity
  const langs = _.uniq(worksLabelsLangs.concat([ originalLang, 'en' ]))
  const articlesParams = langs
    .map(getArticleParams(sitelinks))
    .filter(_.identity)
  return Promise.all(articlesParams.map(getWikipediaArticle))
}

const getArticleParams = sitelinks => lang => {
  const title = sitelinks[`${lang}wiki`]
  if (title) return { lang, title }
}

const getAndCreateOccurrencesFromIds = (prop, getWorkTitlesFn) => async (authorEntity, worksLabels) => {
  // An author should normally have only 1 value per external id property
  // but if there are several, check every available ids
  const ids = authorEntity.claims[prop]
  if (ids == null) return
  const results = await Promise.all(ids.map(getWorkTitlesFn)).then(_.flatten)
  return Promise.all(results.map(createOccurrencesFromExactTitles(worksLabels)))
}

const getBnfOccurrences = getAndCreateOccurrencesFromIds('wdt:P268', getBnfAuthorWorksTitles)
const getOpenLibraryOccurrences = getAndCreateOccurrencesFromIds('wdt:P648', getOlAuthorWorksTitles)
// const getBnbOccurrences = getAndCreateOccurrencesFromIds('wdt:P5361', getBnbAuthorWorksTitles)
const getBneOccurrences = getAndCreateOccurrencesFromIds('wdt:P950', getBneAuthorWorksTitles)
const getGndOccurrences = getAndCreateOccurrencesFromIds('wdt:P227', getGndAuthorWorksTitles)
const getSelibrOccurrences = getAndCreateOccurrencesFromIds('wdt:P906', getSelibrAuthorWorksTitle)
const getKjkOccurrences = getAndCreateOccurrencesFromIds('wdt:P1006', getKjkAuthorWorksTitle)
const getNdlOccurrences = getAndCreateOccurrencesFromIds('wdt:P349', getNdlAuthorWorksTitle)

const createOccurrencesFromUnstructuredArticle = worksLabels => {
  const worksLabelsPattern = new RegExp(worksLabels.join('|'), 'gi')
  return article => {
    if (!article.extract) return
    const matchedTitles = _.uniq(article.extract.match(worksLabelsPattern))
    if (matchedTitles.length <= 0) return
    return { url: article.url, matchedTitles, structuredDataSource: false }
  }
}

const createOccurrencesFromExactTitles = worksLabels => result => {
  const title = normalizeTerm(result.title)
  if (worksLabels.map(normalizeTerm).includes(title)) {
    return {
      url: result.url,
      matchedTitles: [ title ],
      structuredDataSource: true
    }
  }
}
