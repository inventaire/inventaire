import { wikimediaLanguageCodes } from 'wikibase-sdk'

const wikimediaLanguageCodesSet = new Set(wikimediaLanguageCodes)

export const isWikimediaLanguageCode = lang => wikimediaLanguageCodesSet.has(lang)
