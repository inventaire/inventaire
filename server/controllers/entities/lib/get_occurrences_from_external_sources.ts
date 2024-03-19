// A module to look for works labels occurrences in an author's external databases reference.
import ASCIIFolder from 'fold-to-ascii'
// BNB SPARQL service is currently suspended, see https://bnb.data.bl.uk/sparql:
// "The Linked Open BNB is moving to a new home in Spring 2022"
// import getBnbAuthorWorksTitles from '#data/bne/get_bnb_author_works_titles'
import { compact, flatten, identity, uniq } from 'lodash-es'
import getBneAuthorWorksTitles from '#data/bne/get_bne_author_works_titles'
import getBnfAuthorWorksTitles from '#data/bnf/get_bnf_author_works_titles'
import getGndAuthorWorksTitles from '#data/gnd/get_gnd_author_works_titles'
import getKjkAuthorWorksTitle from '#data/kjk/get_kjk_author_works_titles'
import getNdlAuthorWorksTitle from '#data/ndl/get_ndl_author_works_titles'
import getOlAuthorWorksTitles from '#data/openlibrary/get_ol_author_works_titles'
import getSelibrAuthorWorksTitle from '#data/selibr/get_selibr_author_works_titles'
import { getWikipediaArticle } from '#data/wikipedia/get_article'
import { isWdEntityUri } from '#lib/boolean_validations'
import { assert_ } from '#lib/utils/assert_types'
import { logError } from '#lib/utils/logs'
import { getEntityByUri } from './get_entity_by_uri.js'
import { normalizeTerm } from './terms_normalization.js'

// - worksLabels: labels from works of an author suspected
//   to be the same as the wdAuthorUri author
// - worksLabelsLangs: those labels language, indicating which Wikipedia editions
//   should be checked
export async function getOccurrencesFromExternalSources (wdAuthorUri, worksLabels, worksLabelsLangs) {
  assert_.string(wdAuthorUri)
  assert_.strings(worksLabels)
  assert_.strings(worksLabelsLangs)

  if (!isWdEntityUri(wdAuthorUri)) return []

  // get Wikipedia article title from URI
  const authorEntity = await getEntityByUri({ uri: wdAuthorUri })
  // Known case: entities tagged as 'missing' or 'meta'
  if ('sitelinks' in authorEntity) {
    if (authorEntity.sitelinks == null) return []
  }

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
      getNdlOccurrences(authorEntity, worksLabels),
    ])
    return compact(occurrences.flat())
  } catch (err) {
    logError(err, 'has works labels occurrence err')
    return []
  }
}

const getWikipediaOccurrences = async (authorEntity, worksLabels, worksLabelsLangs) => {
  const articles = await getMostRelevantWikipediaArticles(authorEntity, worksLabelsLangs)
  return Promise.all(articles.map(createOccurrencesFromUnstructuredArticle(worksLabels)))
}

export async function getMostRelevantWikipediaArticles (authorEntity, worksLabelsLangs) {
  const { sitelinks, originalLang } = authorEntity
  const langs = compact(uniq(worksLabelsLangs.concat([ originalLang, 'en' ])))
  const articlesParams = langs
    .map(getArticleParams(sitelinks))
    .filter(identity)
  return Promise.all(articlesParams.map(getWikipediaArticle))
}

const getArticleParams = sitelinks => lang => {
  const title = sitelinks[`${lang}wiki`]?.title
  if (title) return { lang, title }
}

const getAndCreateOccurrencesFromIds = (prop, getWorkTitlesFn) => async (authorEntity, worksLabels) => {
  // An author should normally have only 1 value per external id property
  // but if there are several, check every available ids
  const ids = authorEntity.claims[prop]
  if (ids == null) return
  const results = await Promise.all(ids.map(getWorkTitlesFn)).then(flatten)
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

const createOccurrencesFromUnstructuredArticle = worksLabels => article => {
  if (!article.wikitext) return
  const matchedTitles = matchLabelsInArticle(worksLabels, article)
  if (matchedTitles.length <= 0) return
  return { url: article.url, matchedTitles, structuredDataSource: false }
}

function matchLabelsInArticle (labels, article) {
  if (!article.wikitext || labels.length === 0) return []
  const worksLabelsPattern = new RegExp(labels.map(normalize).join('|'), 'g')
  return uniq(normalize(article.wikitext).match(worksLabelsPattern))
}

const createOccurrencesFromExactTitles = worksLabels => result => {
  const title = normalizeTerm(result.title)
  if (worksLabels.map(normalizeTerm).includes(title)) {
    return {
      url: result.url,
      matchedTitles: [ title ],
      structuredDataSource: true,
    }
  }
}

// Example of a case requiring ascii-folding:
// when "’" is used on one side and "'" on the other
const normalize = str => ASCIIFolder.foldMaintaining(str.toLowerCase().normalize())
