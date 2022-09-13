const _ = require('builders/utils')

module.exports = {
  filterFoundSelectionsUris: (selections, uris) => {
    const foundSelections = []
    const notFoundUris = []
    const selectionsByUris = _.keyBy(selections, 'uri')
    uris.forEach(assignSelection(selectionsByUris, foundSelections, notFoundUris))
    return { foundSelections, notFoundUris }
  }
}

const assignSelection = (selectionsByUris, foundSelections, notFoundUris) => uri => {
  const selection = selectionsByUris[uri]
  if (selection) foundSelections.push(selection)
  else notFoundUris.push(uri)
}
