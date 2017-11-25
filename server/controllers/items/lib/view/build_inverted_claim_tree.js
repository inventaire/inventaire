module.exports = entities => entities.reduce(addToTree, {})

const viewProperties = [ 'wdt:P50', 'wdt:P136', 'wdt:P921' ]

const addToTree = (tree, entity) => {
  const { uri } = entity
  for (const property of viewProperties) {
    tree[property] = tree[property] || { unknown: [] }
    const values = entity.claims[property]
    if (values != null) {
      for (const value of values) {
        tree[property][value] = tree[property][value] || []
        tree[property][value].push(uri)
      }
    } else {
      tree[property].unknown.push(uri)
    }
  }

  return tree
}
