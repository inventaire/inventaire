import { pick, values } from 'lodash-es'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { getBestLangValue } from '#lib/get_best_lang_value'
import { requireJson } from '#lib/utils/json'
import type { EntityUri, SerializedEntity } from '#types/entity'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

const wdIdByWmLanguageCode = requireJson('wikidata-lang/mappings/wd_id_by_wm_code.json')

export const sanitization = {
  langs: {
    type: 'wikimedia',
  },
  lang: {
    type: 'wikimedia',
    default: 'en',
  },
}

interface LanguageInfo {
  uri: EntityUri
  label: {
    value: string
    lang: WikimediaLanguageCode
  }
}
type Languages = Partial<Record<WikimediaLanguageCode, LanguageInfo>>

async function controller ({ langs, lang: preferredLang }: { langs: WikimediaLanguageCode[], lang: WikimediaLanguageCode }) {
  const codesWdUris = values(pick(wdIdByWmLanguageCode, langs)).map(prefixifyWd)
  const entities = await getEntitiesList(codesWdUris)
  const requestedLangsSet = new Set(langs)
  const languages: Languages = {}
  for (const entity of entities) {
    const code = entity.claims['wdt:P424']?.find(wmLangCode => requestedLangsSet.has(wmLangCode))
    if (code) {
      languages[code] = pickLangLabel(entity, code, preferredLang)
    }
  }
  return { languages }
}

function pickLangLabel (entity: SerializedEntity, code: WikimediaLanguageCode, preferredLang: WikimediaLanguageCode) {
  return {
    uri: entity.uri,
    label: getBestLangValue(preferredLang, code, entity.labels),
  }
}

export default { sanitization, controller }

export type GetLanguagesInfoResponse = Awaited<ReturnType<typeof controller>>
