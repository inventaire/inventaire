const { addToItem: addSnapshot } = require('controllers/items/lib/snapshot/snapshot')

module.exports = async doc => {
  await addSnapshot(doc)
  return doc
}
