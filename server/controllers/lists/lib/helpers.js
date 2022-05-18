const _ = require('builders/utils')

module.exports = {
  filterFoundSelectionsUris: (selections, uris, foundSelections, notFoundUris) => {
    const selectionsByUris = _.keyBy(selections, 'uri')
    return uris.forEach(assignSelection(selectionsByUris, foundSelections, notFoundUris))
  }
}

const assignSelection = (selectionsByUris, foundSelections, notFoundUris) => uri => {
  const selection = selectionsByUris[uri]
  if (selection) foundSelections.push(selection)
  else notFoundUris.push(uri)
}
