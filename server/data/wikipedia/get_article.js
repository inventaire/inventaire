import { getSitelinkUrl } from 'wikibase-sdk'
import { cache_ } from '#lib/cache'
import { error_ } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { buildUrl } from '#lib/utils/url'

export default params => {
  const { lang, title, introOnly } = params
  const keyBase = introOnly ? 'wpextract' : 'wparticle'
  const key = `${keyBase}:${lang}:${title}`
  return cache_.get({
    key,
    fn: getArticle.bind(null, lang, title, introOnly),
  })
}

const getArticle = async (lang, title, introOnly) => {
  const url = getSitelinkUrl({ site: `${lang}wiki`, title })
  const { host } = new URL(url)
  const queryUrl = apiQuery(host, title, introOnly)
  const { query } = await requests_.get(queryUrl)
  const { pages = [] } = query
  const extract = getCleanExtract(Object.values(pages))
  if (extract != null) {
    return { extract, url }
  } else {
    if (pages['-1']?.missing === '') throw error_.notFound({ lang, title, url, pages })
    else throw error_.new('invalid extract response', 500, { lang, title, url, pages })
  }
}

const apiQuery = (host, title, introOnly) => {
  // doc:
  // - https://en.wikipedia.org/w/api.php?action=help&modules=query
  // - https://www.mediawiki.org/wiki/Extension:TextExtracts
  const queryObj = {
    format: 'json',
    action: 'query',
    titles: title,
    prop: 'extracts',
    // Return the article as plain text instead of html
    explaintext: true,
  }

  // Set exintro only if introOnly is true as any value
  // will be interpreted as true
  if (introOnly) queryObj.exintro = true

  return buildUrl(`https://${host}/w/api.php`, queryObj)
}

// Commas between references aren't removed, thus the presence of aggregated commas
const getCleanExtract = pages => {
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
