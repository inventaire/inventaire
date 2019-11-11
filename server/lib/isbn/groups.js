CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
wdLang = require 'wikidata-lang'
groupsData = require 'isbn-groups'

module.exports = groupsMap = {}

for gs1Prefix, gs1PrefixData of groupsData
  for groupId, groupData of gs1PrefixData
    { lang } = groupData
    if lang?
      wdId = 'wd:' + wdLang.byCode[lang].wd
      groupsMap["#{gs1Prefix}-#{groupId}"] =
        lang: lang
        wd: wdId
