const __ = require('config').universalPath
const runWdQuery = require('data/wikidata/run_query')
const entities_ = require('./entities')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')
const { prefixifyWd } = require('controllers/entities/lib/prefix')

module.exports = async ({ uri, refresh, dry }) => {
  const [ wdCollections, invPublications ] = await Promise.all([
    getWdPublisherCollections(uri, refresh, dry),
    getInvPublisherCollections(uri)
  ])

  return {
    collections: wdCollections.concat(invPublications.collections),
    editions: invPublications.editions
  }
}

const getInvPublisherCollections = async uri => {
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

const getWdPublisherCollections = async (uri, refresh, dry) => {
  const [ prefix, qid ] = uri.split(':')
  if (prefix !== 'wd') return []
  const ids = await runWdQuery({ query: 'publisher-collections', qid, refresh, dry })
  return ids.map(id => ({ uri: prefixifyWd(id) }))
}
