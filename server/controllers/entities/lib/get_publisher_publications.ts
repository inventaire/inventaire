import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import runWdQuery from '#data/wikidata/run_query'
import type { InvEntity, WdEntityId, WdEntityUri } from '#server/types/entity'
import { getInvEntityCanonicalUri } from './get_inv_entity_canonical_uri.js'
import type { Split } from 'type-fest'

export default async function ({ uri, refresh, dry }) {
  const [ wdCollections, invPublications ] = await Promise.all([
    getWdPublisherCollections(uri, refresh, dry),
    getInvPublisherCollections(uri),
  ])

  return {
    collections: [ ...wdCollections, ...invPublications.collections ],
    editions: invPublications.editions,
  }
}

async function getInvPublisherCollections (uri) {
  const docs = await getInvEntitiesByClaim('wdt:P123', uri, true, true)
  const collections = []
  const editions = []

  docs.forEach(publication => {
    if (isEdition(publication)) editions.push(publication)
    else collections.push(publication)
  })

  return {
    collections: collections.sort(byPublicationDate).map(format),
    editions: editions.sort(byPublicationDate).map(format),
  }
}

const byPublicationDate = (a, b) => getPublicationDate(a) - getPublicationDate(b)

const format = (doc: InvEntity) => ({
  uri: getInvEntityCanonicalUri(doc),
  collection: getFirstClaimValue(doc.claims, 'wdt:P195'),
})

const isEdition = publication => getFirstClaimValue(publication.claims, 'wdt:P31') === 'wd:Q3331189'

function getPublicationDate (doc) {
  const date = getFirstClaimValue(doc.claims, 'wdt:P577')
  if (date) return new Date(date).getTime()
  // If no publication date can be found, we can fallback on the document creation date,
  // as the edition can't have been published much later than its associated entity was created
  // (much more probably, was published before)
  else return doc.created
}

async function getWdPublisherCollections (uri: WdEntityUri, refresh: boolean, dry: boolean) {
  const [ prefix, qid ] = uri.split(':') as Split<WdEntityUri, ':'>
  if (prefix !== 'wd') return []
  const ids: WdEntityId[] = await runWdQuery({ query: 'publisher-collections', qid, refresh, dry })
  return ids.map(id => ({ uri: prefixifyWd(id) }))
}
