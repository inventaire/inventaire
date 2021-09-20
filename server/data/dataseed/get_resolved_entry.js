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

module.exports = async isbn => {
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
  return { isbn, notFound: true }
}

const getEditionEntityFromEntry = async entry => {
  const { resolvedEntries } = await resolveUpdateAndCreate({ entries: [ entry ], ...resolverParams })
  const [ resolvedEntry ] = resolvedEntries
  if (resolvedEntry) {
    const { uri } = resolvedEntry.edition
    if (uri) return getEntityByUri({ uri })
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
