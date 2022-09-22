const _ = require('builders/utils')

module.exports = {
  filterFoundElementsUris: (elements, uris) => {
    const foundElements = []
    const notFoundUris = []
    const elementsByUris = _.keyBy(elements, 'uri')
    uris.forEach(assignElement(elementsByUris, foundElements, notFoundUris))
    return { foundElements, notFoundUris }
  }
}

const assignElement = (elementsByUris, foundElements, notFoundUris) => uri => {
  const element = elementsByUris[uri]
  if (element) foundElements.push(element)
  else notFoundUris.push(uri)
}
