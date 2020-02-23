const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const error_ = __.require('lib', 'error/error')
const qs = require('querystring')
const cache_ = __.require('lib', 'cache')
const { oneMonth } = __.require('lib', 'times')

module.exports = params => {
  const { lang, title, introOnly } = params
  const keyBase = introOnly ? 'wpextract' : 'wparticle'
  const key = `${keyBase}:${lang}:${title}`
  return cache_.get({
    key,
    fn: getArticle.bind(null, lang, title, introOnly),
    timespan: 3 * oneMonth
  })
}

const getArticle = (lang, title, introOnly) => {
  return requests_.get(apiQuery(lang, title, introOnly))
  .then(res => {
    const { pages } = res.query
    if (pages == null) {
      throw error_.new('invalid extract response', 500, { lang, title }, res.query)
    }

    return {
      extract: getCleanExtract(_.values(pages)),
      url: `https://${lang}.wikipedia.org/wiki/${title}`
    }
  })
}

const apiQuery = (lang, title, introOnly) => {
  title = qs.escape(title)

  // doc:
  // - https://en.wikipedia.org/w/api.php?action=help&modules=query
  // - https://www.mediawiki.org/wiki/Extension:TextExtracts
  const queryObj = {
    format: 'json',
    action: 'query',
    titles: title,
    prop: 'extracts',
    // Return the article as plain text instead of html
    explaintext: true
  }

  // Set exintro only if introOnly is true as any value
  // will be interpreted as true
  if (introOnly) queryObj.exintro = true

  return _.buildPath(`https://${lang}.wikipedia.org/w/api.php`, queryObj)
}

// Commas between references aren't removed, thus the presence of aggregated commas
const getCleanExtract = pages => {
  const extract = pages && pages[0] && pages[0].extract
  if (extract) {
    return extract
    // Commas between references aren't removed, thus the presence of aggregated commas
    .replace(/,,/g, ',')
    .replace(/,\./g, '.')
    // Some empty parenthesis need to be removed
    // ex: https://fr.wikipedia.org/wiki/France
    .replace(/\(\)/g, '')
  }
}
