// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const wdLang = require('wikidata-lang')

module.exports = function(claims){
  const langClaims = _.pick(claims, langProperties)
  if (_.objLength(langClaims) === 0) return 

  const originalLangUri = __guard__(_.pickOne(langClaims), x => x[0])
  if (originalLangUri != null) {
    const wdId = unprefixify(originalLangUri)
    return (wdLang.byWdId[wdId] != null ? wdLang.byWdId[wdId].code : undefined)
  }
}

var langProperties = [
  'wdt:P103', // native language
  'wdt:P407', // language of work
  'wdt:P1412', // languages spoken, written or signed
  'wdt:P2439', // language (general)
  // About to be merged into wdt:P407
  'wdt:P364' // original language of work
]

// Unprefixify both entities ('item' in Wikidata lexic) and properties
var unprefixify = value => value != null ? value.replace(/^wdt?:/, '') : undefined

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}