import groupsData from 'isbn-groups'
import { requireJson } from '#lib/utils/json'

const wdIdByIso6391Code = requireJson('wikidata-lang/mappings/wd_id_by_iso_639_1_code.json')

const groupsMap = {}

export default groupsMap

for (const gs1Prefix in groupsData) {
  const gs1PrefixData = groupsData[gs1Prefix]
  for (const groupId in gs1PrefixData) {
    const lang = gs1PrefixData[groupId]
    if (lang && wdIdByIso6391Code[lang]) {
      const wdId = `wd:${wdIdByIso6391Code[lang]}`
      groupsMap[`${gs1Prefix}-${groupId}`] = { lang, wd: wdId }
    }
  }
}
