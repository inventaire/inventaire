const __ = require('config').universalPath
const { addToItem } = __.require('controllers', 'items/lib/snapshot/snapshot')

module.exports = async doc => {
  await addToItem(doc)
  return doc
}
