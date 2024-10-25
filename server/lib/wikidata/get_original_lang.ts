import { compact, pick } from 'lodash-es'
import wdLang from 'wikidata-lang/indexes/by_wd_id.js'
import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { objectEntries, objectFromEntries, objLength } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import { objectKeys } from '#lib/utils/types'
import type { Claims, PropertyUri, WdEntityId, WdEntityUri } from '#server/types/entity'

const wmLanguageCodeByWdId = requireJson('wikidata-lang/mappings/wm_code_by_wd_id.json')

export function getOriginalLang (claims: Claims) {
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

// eslint-disable-next-line array-callback-return
const wdIdAndLabelEntries = objectEntries(wdLang).map(([ wdId, { label } ]) => {
  if (label) return [ wdId, label ] as [ WdEntityId, string ]
})
const labelByWdId = objectFromEntries(compact(wdIdAndLabelEntries))

export function getLanguageEnglishLabel (uri: WdEntityUri) {
  const id = unprefixify(uri)
  return labelByWdId[id]
}
