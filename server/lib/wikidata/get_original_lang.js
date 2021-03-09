const _ = require('builders/utils')
const wdLang = require('wikidata-lang')
const { unprefixify } = require('controllers/entities/lib/prefix')

module.exports = claims => {
  const langPropertiesClaims = _.pick(claims, langProperties)
  if (_.objLength(langPropertiesClaims) === 0) return

  const someLangPropertyClaims = _.pickOne(langPropertiesClaims)
  const originalLangUri = someLangPropertyClaims[0]
  if (originalLangUri != null) {
    const wdId = unprefixify(originalLangUri)
    const wdLangData = wdLang.byWdId[wdId]
    if (wdLangData) return wdLangData.code
  }
}

const langProperties = [
  'wdt:P103', // native language
  'wdt:P407', // language of work
  'wdt:P1412', // languages spoken, written or signed
  'wdt:P2439' // language (general)
]
