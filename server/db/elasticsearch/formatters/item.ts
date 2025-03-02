import { addItemSnapshot } from '#controllers/items/lib/snapshot/snapshot'

export default async function (doc) {
  await addItemSnapshot(doc)
  delete doc.notes
  delete doc.previousEntities
  return doc
}
