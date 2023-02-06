import { types } from '#lib/wikidata/aliases'

// Takes an entity wdt:P31 (instance of) claims array
// Returns a entity type string: work, edition, article, human, genre
export default wdtP31Array => {
  if (wdtP31Array == null) return

  for (const value of wdtP31Array) {
    const type = types[value]
    // return as soon as we get a type
    if (type) return type
  }
}
