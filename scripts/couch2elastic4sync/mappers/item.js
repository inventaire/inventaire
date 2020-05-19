const __ = require('config').universalPath
const { addToItem: addSnapshot } = __.require('controllers', 'items/lib/snapshot/snapshot')

module.exports = async doc => {
  await addSnapshot(doc)
  return doc
}
