import { normalizeASCII } from '#controllers/entities/lib/terms_normalization'
import getArticle from '#data/wikipedia/get_article'
import { isNonEmptyArray } from '#lib/boolean_validations'

export const addTaskContexts = async task => {
  const { externalSourcesOccurrences } = task
  await Promise.all(externalSourcesOccurrences.map(addContexts))
  return task
}

const addContexts = async occurrence => {
  const { url, matchedTitles, structuredDataSource } = occurrence
  const { lang, title } = parseUrl(url)
  if (structuredDataSource || !lang || !title) return occurrence
  const article = await getArticle({ lang, title })
  const contexts = createContexts(article, matchedTitles)
  if (isNonEmptyArray(contexts)) occurrence.contexts = contexts
  return occurrence
}

const createContexts = (rawArticle, matchedTitles) => {
  const matchedTitlesPattern = matchedTitles.map(normalizeASCII).join('|')
  const article = normalizeASCII(rawArticle.extract)
  const worksLabelsPattern = new RegExp(`([\\s\\S]{50})(${matchedTitlesPattern})([\\s\\S]{50})`, 'g')
  const contexts = article.match(worksLabelsPattern) || []
  return contexts.slice(0, 10)
}

const parseUrl = url => {
  const lang = url.split('https://')[1].split('.wikipedia.org')[0]
  const urlTitle = url.split('.wikipedia.org/wiki/')[1]
  const title = decodeURIComponent(urlTitle)
  return { lang, title }
}
