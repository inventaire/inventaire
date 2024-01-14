import { flatMap, intersection } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { getMostRelevantWikipediaArticles } from '#controllers/entities/lib/get_occurrences_from_external_sources'
import { normalizeIsbn, findIsbns, isValidIsbn } from '#lib/isbn/isbn'

export async function findAuthorWithMatchingIsbnInWikipediaArticles (worksData, authors) {
  // worksData is built with getAuthorWorksData
  const { langs, worksUris } = worksData
  const editions = await Promise.all(getEditionsFromWorks(worksUris))
    .then(flatMap)
  const isbns = getIsbnsClaimValues(editions)
  if (isbns.length === 0) return
  return authors.find(hasIsbnInWikipediaArticles(langs, isbns))
}

function getIsbnsClaimValues (editions) {
  return editions.flatMap(edition => {
    const isbns13 = edition.claims['wdt:P212'] || []
    const isbns10 = edition.claims['wdt:P957'] || []
    return isbns13.concat(isbns10)
  })
}

const hasIsbnInWikipediaArticles = (langs, claimsIsbns) => async suggestion => {
  const articles = await getMostRelevantWikipediaArticles(suggestion, langs)
  if (articles.length === 0) return
  return articles.find(hasMatchingIsbns(claimsIsbns))
}

const hasMatchingIsbns = claimsIsbns => article => {
  const articleIsbns = findIsbns(article.extract)
  if (articleIsbns.length > 0) {
    const normalizedClaimsIsbns = claimsIsbns.map(normalizeIsbn)
    const normalizedArticleIsbns = articleIsbns.map(normalizeIsbn).filter(isValidIsbn)
    return intersection(normalizedClaimsIsbns, normalizedArticleIsbns)
  }
}

function getEditionsFromWorks (worksUris) {
  return worksUris.map(uri => getInvEntitiesByClaim('wdt:P629', uri, true, true))
}
