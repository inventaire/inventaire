const { addToItem: addSnapshot } = require('controllers/items/lib/snapshot/snapshot')

module.exports = async doc => {
  await addSnapshot(doc)
  delete doc.notes
  delete doc.previousEntity
  return doc
}
