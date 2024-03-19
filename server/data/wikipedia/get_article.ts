import { getSitelinkUrl } from 'wikibase-sdk'
import { cache_ } from '#lib/cache'
import { notFoundError, newError } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { buildUrl } from '#lib/utils/url'
import { normalizeSiteKey } from '#lib/wikimedia'

export async function getWikipediaArticle (params) {
  const { lang, title, introOnly } = params
  const keyBase = introOnly ? 'wpextract' : 'wpwikitext'
  const key = `${keyBase}:${lang}:${title}`
  return cache_.get({
    key,
    fn: getArticle.bind(null, lang, title, introOnly),
  })
}

async function getArticle (lang, title, introOnly) {
  const site = normalizeSiteKey(`${lang}wiki`)
  const url = getSitelinkUrl({ site, title })
  const { host } = new URL(url)
  if (introOnly) {
    return getArticleIntroExtract({ host, title, lang, url })
  } else {
    return getArticleRawWikiText({ host, title, url })
  }
}

async function getArticleIntroExtract ({ host, title, lang, url }) {
  // doc:
  // - https://en.wikipedia.org/w/api.php?action=help&modules=query
  // - https://www.mediawiki.org/wiki/Extension:TextExtracts
  const queryUrl = buildUrl(`https://${host}/w/api.php`, {
    format: 'json',
    action: 'query',
    titles: title,
    prop: 'extracts',
    exintro: true,
    // Return the article as plain text instead of html
    explaintext: true,
  })
  const { query } = await requests_.get(queryUrl)
  const { pages = [] } = query
  const extract = getCleanExtract(Object.values(pages))
  if (extract != null) {
    return { extract, url }
  } else {
    if (pages['-1']?.missing === '') throw notFoundError({ lang, title, url, pages })
    else throw newError('invalid extract response', 500, { lang, title, url, pages })
  }
}

// Commas between references aren't removed, thus the presence of aggregated commas
function getCleanExtract (pages) {
  const extract = pages?.[0]?.extract
  if (extract != null) {
    return extract
    // Commas between references aren't removed, thus the presence of aggregated commas
    .replaceAll(',,', ',')
    .replaceAll(',.', '.')
    // Some empty parenthesis need to be removed
    // ex: https://fr.wikipedia.org/wiki/France
    .replaceAll('()', '')
  }
}

async function getArticleRawWikiText ({ host, title, url }) {
  const rawArticleUrl = buildUrl(`https://${host}/w/index.php`, { title, action: 'raw' })
  const rawArticle = await requests_.get(rawArticleUrl, { parseJson: false })
  return { wikitext: rawArticle, url }
}
