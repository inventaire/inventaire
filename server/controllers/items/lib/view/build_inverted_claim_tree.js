const base = () => ({
  author: {},
  genre: {},
  subject: {}
})

const viewProperties = {
  'wdt:P50': 'author',
  'wdt:P136': 'genre',
  'wdt:P921': 'subject'
}

const addToTree = (tree, entity) => {
  const { uri } = entity
  for (const property in viewProperties) {
    const name = viewProperties[property]
    const values = entity.claims[property]
    if (values != null) {
      for (const value of values) {
        tree[name][value] = tree[name][value] || []
        tree[name][value].push(uri)
      }
    } else {
      tree[name].unknown = tree[name].unknown || []
      tree[name].unknown.push(uri)
    }
  }

  return tree
}

module.exports = entities => entities.reduce(addToTree, base())
