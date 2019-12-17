const __ = require('config').universalPath
const { types } = __.require('lib', 'wikidata/aliases')

// Takes an entity wdt:P31 (instance of) claims array
// Returns a entity type string: work, edition, article, human, genre
// If no type is found, try with the wdt:P279 (subclass of) claims array
// (used for Wikidata entities only, as all inv entities have a known P31)
module.exports = (wdtP31Array, wdtP279Array) => {
  const type = getType(wdtP31Array) || getType(wdtP279Array)
  if (type) { return type }
}

const getType = wdtArray => {
  if (wdtArray == null) return

  for (const value of wdtArray) {
    const type = types[value]
    if (type) return type
  }
}
