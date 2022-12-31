import follow from 'lib/follow'
import filters from './filters'
import indexation from './indexation'

export default indexBaseName => {
  follow({
    dbBaseName: indexBaseName,
    filter: filters[indexBaseName],
    onChange: reindex(indexBaseName)
  })
}

const reindex = indexBaseName => {
  const indexFn = indexation(indexBaseName)
  return ({ doc }) => indexFn(doc)
}
