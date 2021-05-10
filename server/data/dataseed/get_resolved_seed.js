const { _id: seedUserId } = require('db/couchdb/hard_coded_documents').users.seed

const resolverParams = {
  create: true,
  update: true,
  strict: true,
  enrich: true,
  reqUserId: seedUserId
}

let resolveUpdateAndCreate, getEntityByUri, getBnfSeedFromIsbn
const requireCircularDependencies = () => {
  ({ resolveUpdateAndCreate } = require('controllers/entities/lib/resolver/resolve_update_and_create'))
  getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
  getBnfSeedFromIsbn = require('data/bnf/get_bnf_seed_from_isbn')
}
setImmediate(requireCircularDependencies)

module.exports = async isbn => {
  const entry = await getBnfSeedFromIsbn(isbn)
  if (entry) {
    const { resolvedEntries } = await resolveUpdateAndCreate({ entries: [ entry ], ...resolverParams })
    const [ resolvedEntry ] = resolvedEntries
    if (resolvedEntry) {
      const { uri } = resolvedEntry.edition
      if (uri) return getEntityByUri({ uri })
    }
  }
  // TODO: recover fetching dataseed
  return { isbn, notFound: true }
}
