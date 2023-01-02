import { addToItem as addSnapshot } from '#controllers/items/lib/snapshot/snapshot'

export default async doc => {
  await addSnapshot(doc)
  delete doc.notes
  delete doc.previousEntity
  return doc
}
