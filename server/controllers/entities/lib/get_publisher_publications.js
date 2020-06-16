const entities_ = require('./entities')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')

module.exports = async ({ uri }) => {
  const docs = await entities_.byClaim('wdt:P123', uri, true, true)
  const collections = []
  const editions = []

  docs.forEach(publication => {
    if (isEdition(publication)) editions.push(publication)
    else collections.push(publication)
  })

  return {
    collections: collections.sort(byPublicationDate).map(format),
    editions: editions.sort(byPublicationDate).map(format)
  }
}

const byPublicationDate = (a, b) => getPublicationDate(a) - getPublicationDate(b)

const format = doc => ({
  uri: getInvEntityCanonicalUri(doc),
  collection: doc.claims['wdt:P195'] && doc.claims['wdt:P195'][0]
})

const isEdition = publication => publication.claims['wdt:P31'][0] === 'wd:Q3331189'

const getPublicationDate = doc => {
  const date = doc.claims['wdt:P577'] && doc.claims['wdt:P577'][0]
  if (date) return new Date(date).getTime()
  // If no publication date can be found, we can fallback on the document creation date,
  // as the edition can't have been published much later than its associated entity was created
  // (much more probably, was published before)
  else return doc.created
}
