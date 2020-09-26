const formatters = require('./formatters/formatters')
const filters = require('./filters')
const deindex = require('./deindex')
const { addToNextBatch } = require('./bulk')

module.exports = (indexBaseName, index) => {
  index = index || indexBaseName
  const format = formatters[indexBaseName]
  const shouldBeDeindexed = deindex[indexBaseName]
  const filter = filters[indexBaseName]
  return async doc => {
    if (!filter(doc)) return
    if (shouldBeDeindexed(doc)) {
      addToNextBatch('delete', index, doc)
    } else {
      const formattedDoc = await format(doc)
      addToNextBatch('index', index, formattedDoc)
    }
  }
}
