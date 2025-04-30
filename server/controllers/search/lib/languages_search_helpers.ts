import { isWikimediaLanguageCode } from '#lib/wikimedia'

export function hasValidWikimediaLanguageCode (result) {
  return isWikimediaLanguageCode(result.claims['wdt:P424'][0])
}
