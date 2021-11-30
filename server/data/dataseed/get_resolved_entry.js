const _ = require('builders/utils')
const { _id: seedUserId } = require('db/couchdb/hard_coded_documents').users.seed
const { getByIsbns: getSeedsByIsbns } = require('./dataseed')
const { enabled: dataseedEnabled } = require('config').dataseed
const parseIsbn = require('server/lib/isbn/parse')
const { resolvePublisher } = require('controllers/entities/lib/resolver/resolve_publisher')

const resolverParams = {
  create: true,
  update: true,
  strict: true,
  enrich: true,
  reqUserId: seedUserId
}

let resolveUpdateAndCreate, getEntityByUri, getAuthoritiesAggregatedEntry
const requireCircularDependencies = () => {
  ({ resolveUpdateAndCreate } = require('controllers/entities/lib/resolver/resolve_update_and_create'))
  getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
  getAuthoritiesAggregatedEntry = require('./get_authorities_aggregated_entry')
}
setImmediate(requireCircularDependencies)

module.exports = {
  getResolvedEntry: async entry => {
    const { isbn } = entry.edition
    try {
      const authoritiesEntry = await getAuthoritiesAggregatedEntry(isbn)
      let resolvedEntry
      if (authoritiesEntry) {
        resolvedEntry = await autocreateAndResolve(authoritiesEntry)
      }

      if (dataseedEnabled) {
        const [ seed ] = await getSeedsByIsbns(isbn)
        if (seed) {
          const dataseedEntry = await buildEntry(seed)
          if (dataseedEntry) {
            resolvedEntry = await autocreateAndResolve(dataseedEntry)
          }
        }
      }
      // Here one could update the missing entry claims (known case: importers data)
      // but an update en masse may not be desirable
      // better let the user responsible of those contributions later
      return resolvedEntry
    } catch (err) {
      _.error(err, 'get_resolved_entry error')
    }
    return { entry, notFound: true }
  },
  getResolvedEntity: async isbn => {
    try {
      const entry = await getAuthoritiesAggregatedEntry(isbn)
      if (entry) {
        const entity = await getEditionEntityFromEntry(entry)
        if (entity) return entity
      }
      if (dataseedEnabled) {
        const [ seed ] = await getSeedsByIsbns(isbn)
        if (seed) {
          const dataseedEntry = await buildEntry(seed)
          const entity = await getEditionEntityFromEntry(dataseedEntry)
          if (entity) return entity
          return dataseedEntry
        }
      }
    } catch (err) {
      _.error(err, 'get_resolved_entity error')
    }
    return { isbn, notFound: true }
  }
}

const buildEntry = async seed => {
  const { title, authors, image, publisher, publicationDate, isbn } = seed
  const isbnData = parseIsbn(isbn)
  const lang = isbnData.groupLang || 'en'
  const entry = {
    edition: {
      isbn,
      claims: {
        'wdt:P1476': title
      },
      image,
    },
    works: {
      labels: { [lang]: title }
    },
    authors: authors.map(authorName => ({
      labels: { [lang]: authorName }
    }))
  }
  if (publicationDate) entry.edition.claims['wdt:P577'] = publicationDate
  if (publisher) {
    const publisherUri = await resolvePublisher(isbn, publisher)
    if (publisherUri) entry.edition.claims['wdt:P123'] = publisherUri
  }
  return entry
}

const resolveDataseedEntry = async (entry, params) => {
  const { resolvedEntries } = await resolveUpdateAndCreate({ entries: [ entry ], params })
  const [ resolvedEntry ] = resolvedEntries
  return resolvedEntry
}

const getEditionEntityFromEntry = async entry => {
  const resolvedEntry = await resolveDataseedEntry(entry, resolverParams)
  if (resolvedEntry) return getEditionFromEntryUri(resolvedEntry)
}

const getEditionFromEntryUri = async entry => {
  const uri = entry.edition.uri || `isbn:${entry.edition.isbn}`
  const entity = await getEntityByUri({ uri })
  if (uri) return entity
}

const autocreateAndResolve = async entry => {
  const { claims } = await getEditionFromEntryUri(entry)
  entry.edition.claims = claims
  return resolveDataseedEntry(entry, resolverParams)
}
