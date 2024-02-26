import { bulkUpdateElements, getElementsByEntities } from '#controllers/listings/lib/elements'

export async function updateElementsUris (currentUri, newUri) {
  const oldElements = await getElementsByEntities([ currentUri ])
  await bulkUpdateElements({
    oldElements,
    attribute: 'uri',
    value: newUri,
  })
}
