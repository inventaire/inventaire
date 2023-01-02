import { addSnapshotToItem } from '#controllers/items/lib/snapshot/snapshot'

export default async doc => {
  await addSnapshotToItem(doc)
  delete doc.notes
  delete doc.previousEntity
  return doc
}
