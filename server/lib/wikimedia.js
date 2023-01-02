import wikimediaLanguageCodes from 'wikibase-sdk/lib/helpers/sitelinks_languages.js'

const wikimediaLanguageCodesSet = new Set(wikimediaLanguageCodes)

export const isWikimediaLanguageCode = lang => wikimediaLanguageCodesSet.has(lang)
