import { flatMap } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { getMostRelevantWikipediaArticles, matchLabelsInArticle } from '#controllers/entities/lib/get_occurrences_from_external_sources'

export async function findAuthorsWithIsbnsInWikipediaArticles (worksData, authors) {
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

const hasIsbnInWikipediaArticles = (langs, isbns) => async suggestion => {
  const articles = await getMostRelevantWikipediaArticles(suggestion, langs)
  if (articles.length === 0) return
  const matchedArticle = articles.find(hasMatchingLabels(isbns))
  if (matchedArticle) return suggestion
}

const hasMatchingLabels = article => labels => {
  const matchedLabels = matchLabelsInArticle(labels, article)
  return matchedLabels.length > 0
}

function getEditionsFromWorks (worksUris) {
  return worksUris.map(uri => getInvEntitiesByClaim('wdt:P629', uri, true, true))
}
