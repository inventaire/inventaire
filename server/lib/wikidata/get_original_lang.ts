import { pick } from 'lodash-es'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { objLength } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import { objectKeys } from '#lib/utils/types'
import { getClaimValue } from '#models/entity'
import type { Claims, PropertyUri, WdEntityUri } from '#server/types/entity'

const wmLanguageCodeByWdId = requireJson('wikidata-lang/mappings/wm_code_by_wd_id.json')

export default (claims: Claims) => {
  const langPropertiesClaims = pick(claims, langProperties)
  if (objLength(langPropertiesClaims) === 0) return

  const property = objectKeys(langPropertiesClaims)[0] as PropertyUri
  const originalLangUri = getClaimValue(claims[property][0]) as WdEntityUri
  if (originalLangUri != null) {
    const wdId = unprefixify(originalLangUri)
    return wmLanguageCodeByWdId[wdId]
  }
}

const langProperties = [
  'wdt:P103', // native language
  'wdt:P407', // language of work
  'wdt:P1412', // languages spoken, written or signed
  'wdt:P2439', // language (general)
]
