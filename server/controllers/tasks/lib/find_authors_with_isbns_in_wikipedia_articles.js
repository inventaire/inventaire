import { flatMap, intersection } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { getMostRelevantWikipediaArticles } from '#controllers/entities/lib/get_occurrences_from_external_sources'
import { normalizeIsbn, findIsbns, isValidIsbn } from '#lib/isbn/isbn'
import { asyncFilter } from '#lib/promises'

export async function findAuthorWithMatchingIsbnInWikipediaArticles (worksData, authors) {
  // worksData is built with getAuthorWorksData
  const { langs, worksUris } = worksData
  const editions = await getEditionsFromWorks(worksUris)
  const isbns = getIsbnsClaimValues(editions)
  if (isbns.length === 0) return

  const matchingAuthors = await asyncFilter(authors, hasIsbnInWikipediaArticles(langs, isbns))
  if (matchingAuthors.length === 1) return matchingAuthors[0]
}

function getIsbnsClaimValues (editions) {
  return editions.flatMap(edition => {
    const isbns13 = edition.claims['wdt:P212'] || []
    const isbns10 = edition.claims['wdt:P957'] || []
    return isbns13.concat(isbns10)
  })
}

const hasIsbnInWikipediaArticles = (langs, claimsIsbns) => async author => {
  const articles = await getMostRelevantWikipediaArticles(author, langs)
  if (articles.length === 0) return
  return articles.find(hasMatchingIsbns(claimsIsbns))
}

const hasMatchingIsbns = claimsIsbns => article => {
  const articleIsbns = findIsbns(article.extract)
  if (articleIsbns.length > 0) {
    const normalizedClaimsIsbns = claimsIsbns.map(normalizeIsbn)
    const normalizedArticleIsbns = articleIsbns.map(normalizeIsbn).filter(isValidIsbn)
    return intersection(normalizedClaimsIsbns, normalizedArticleIsbns).length > 0
  }
}

async function getEditionsFromWorks (worksUris) {
  return Promise.all(worksUris.map(uri => {
    return getInvEntitiesByClaim('wdt:P629', uri, true, true)
  })).then(flatMap)
}
