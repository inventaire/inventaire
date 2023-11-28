import { wikimediaLanguageCodes } from 'wikibase-sdk'

const wikimediaLanguageCodesSet = new Set(wikimediaLanguageCodes)

export const isWikimediaLanguageCode = lang => wikimediaLanguageCodesSet.has(normalizeWikimediaLang(lang))

// Wikidata sitelink keys use `_` but site urls use `-`
// Normalize to `-` has that's what wikimediaLanguageCodes has
export function normalizeWikimediaLang (lang) {
  return lang.replace(/_/g, '-')
}
