const __ = require('config').universalPath
const { types } = __.require('lib', 'wikidata/aliases')

// Takes an entity wdt:P31 (instance of) claims array
// Returns a entity type string: work, edition, article, human, genre
// If no type is found, try with the wdt:P279 (subclass of) claims array
// (used for Wikidata entities only, as all inv entities have a known P31)
module.exports = (wdtP31Array, wdtP279Array) => {
  if (wdtP31Array == null) return

  for (const value of wdtP31Array) {
    const type = types[value]
    // return as soon as we get a type
    if (type) return type
  }

  if (wdtP279Array == null) return

  for (const value of wdtP279Array) {
    const type = types[value]
    // return as soon as we get a type
    if (type) return type
  }
}
