import follow from '#lib/follow'
import filters from './filters.js'
import indexation from './indexation.js'

export default indexBaseName => {
  follow({
    dbBaseName: indexBaseName,
    filter: filters[indexBaseName],
    onChange: reindex(indexBaseName),
  })
}

const reindex = indexBaseName => {
  const indexFn = indexation(indexBaseName)
  return ({ doc }) => indexFn(doc)
}
