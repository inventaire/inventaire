const wdLang = require('wikidata-lang')
const groupsData = require('isbn-groups')

const groupsMap = module.exports = {}

for (const gs1Prefix in groupsData) {
  const gs1PrefixData = groupsData[gs1Prefix]
  for (const groupId in gs1PrefixData) {
    const lang = gs1PrefixData[groupId]
    if (lang) {
      const wdId = `wd:${wdLang.byCode[lang].wd}`
      groupsMap[`${gs1Prefix}-${groupId}`] = { lang, wd: wdId }
    }
  }
}
