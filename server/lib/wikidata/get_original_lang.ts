import { pick } from 'lodash-es'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { objLength, pickOne } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'

const wmLanguageCodeByWdId = requireJson('wikidata-lang/mappings/wm_code_by_wd_id.json')

export default claims => {
  const langPropertiesClaims = pick(claims, langProperties)
  if (objLength(langPropertiesClaims) === 0) return

  const someLangPropertyClaims = pickOne(langPropertiesClaims)
  const originalLangUri = someLangPropertyClaims[0]
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
