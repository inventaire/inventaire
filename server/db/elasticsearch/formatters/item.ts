import { addSnapshotToItem } from '#controllers/items/lib/snapshot/snapshot'

export default async function (doc) {
  await addSnapshotToItem(doc)
  delete doc.notes
  delete doc.previousEntity
  return doc
}
