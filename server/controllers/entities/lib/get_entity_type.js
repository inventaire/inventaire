// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { types } =  __.require('lib', 'wikidata/aliases')

// Takes an entity wdt:P31 (instance of) claims array
// Returns a entity type string: work, edition, article, human, genre
// If no type is found, try with the wdt:P279 (subclass of) claims array
// (used for Wikidata entities only, as all inv entities have a known P31)
module.exports = function(wdtP31Array, wdtP279Array){
  let type, value
  if (wdtP31Array == null) return 

  for (value of wdtP31Array) {
    type = types[value]
    // return as soon as we get a type
    if (type != null) return type
  }

  if (wdtP279Array == null) return 

  for (value of wdtP279Array) {
    type = types[value]
    // return as soon as we get a type
    if (type != null) return type
  }

}
