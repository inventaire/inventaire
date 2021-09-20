const { resolvePublisher } = require('controllers/entities/lib/resolver/resolve_publisher')

const setEditionPublisherClaim = async entry => {
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

module.exports = { setEditionPublisherClaim }
