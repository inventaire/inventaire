const _ = require('builders/utils')

module.exports = {
  filterFoundSelectionsUris: (selections, uris, selectionsToDelete, notFoundUris) => {
    const selectionsByUris = _.keyBy(selections, 'uri')
    return uris.forEach(uri => {
      const selection = selectionsByUris[uri]
      if (selection) selectionsToDelete.push(selection)
      else notFoundUris.push(uri)
    })
  }
}
