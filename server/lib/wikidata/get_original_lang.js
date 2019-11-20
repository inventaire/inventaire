// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const wdLang = require('wikidata-lang')
const { unprefixify } = __.require('controllers', 'entities/lib/prefix')

module.exports = claims => {
  const langPropertiesClaims = _.pick(claims, langProperties)
  if (_.objLength(langPropertiesClaims) === 0) return

  const someLangPropertyClaims = _.pickOne(langPropertiesClaims)
  const originalLangUri = someLangPropertyClaims[0]
  if (originalLangUri != null) {
    const wdId = unprefixify(originalLangUri)
    return (wdLang.byWdId[wdId] != null ? wdLang.byWdId[wdId].code : undefined)
  }
}

const langProperties = [
  'wdt:P103', // native language
  'wdt:P407', // language of work
  'wdt:P1412', // languages spoken, written or signed
  'wdt:P2439', // language (general)
  // About to be merged into wdt:P407
  'wdt:P364' // original language of work
]
