const wikimediaLanguageCodes = require('wikibase-sdk/lib/helpers/sitelinks_languages')
const wikimediaLanguageCodesSet = new Set(wikimediaLanguageCodes)

const isWikimediaLanguageCode = lang => wikimediaLanguageCodesSet.has(lang)

module.exports = {
  isWikimediaLanguageCode,
}
