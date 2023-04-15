import { bulkUpdate, byEntities } from '#controllers/listings/lib/elements'

export default async (currentUri, newUri) => {
  const oldElements = await byEntities([ currentUri ])
  await bulkUpdate({
    oldElements,
    attribute: 'uri',
    value: newUri,
  })
}
