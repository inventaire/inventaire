import { resolvePublisher } from '#controllers/entities/lib/resolver/resolve_publisher'
import type { EntityLooseSeed, ResolverEntry } from '#types/resolver'

export async function setEditionPublisherClaim (entry: ResolverEntry & { publishers?: EntityLooseSeed[] }) {
  if (!entry?.publishers) return
  const { publishers } = entry
  if (Object.keys(publishers).length !== 1) return
  const publisher = Object.values(publishers)[0]
  const { isbn } = entry.edition
  const publisherLabel = Object.values(publisher.labels)[0]
  const publisherUri = await resolvePublisher(isbn, publisherLabel)
  if (publisherUri) entry.edition.claims['wdt:P123'] = publisherUri
  delete entry.publishers
}
