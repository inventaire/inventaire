import _ from '#builders/utils'

const base = () => ({
  author: {},
  genre: {},
  subject: {},
})

const viewProperties = {
  'wdt:P50': 'author',
  'wdt:P136': 'genre',
  'wdt:P921': 'subject',
}

const addToTree = (tree, entity) => {
  const { uri, claims } = entity

  if (claims == null) {
    _.warn(entity, 'entity can not be added to tree')
    return tree
  }

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

export default entities => entities.reduce(addToTree, base())
