const formatters = require('./formatters/formatters')
const filters = require('./filters')
const deindex = require('./deindex')
const { addToNextBatch } = require('./bulk')

module.exports = ({ indexBaseName, index, startFromEmptyIndex = false }) => {
  index = index || indexBaseName
  const format = formatters[indexBaseName]
  const shouldBeDeindexed = deindex[indexBaseName]
  const filter = filters[indexBaseName]
  return async doc => {
    if (!filter(doc)) return
    if (shouldBeDeindexed(doc)) {
      // There is nothing to deindex when starting from an empty index
      if (!startFromEmptyIndex) addToNextBatch('delete', index, doc)
    } else {
      const formattedDoc = await format(doc)
      addToNextBatch('index', index, formattedDoc)
    }
  }
}
