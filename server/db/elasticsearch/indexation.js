const formatters = require('./formatters/formatters')
const deindex = require('./deindex')
const { addToNextBatch } = require('./bulk')

module.exports = (indexBaseName, index) => {
  index = index || indexBaseName
  const format = formatters[indexBaseName]
  const shouldBeDeindexed = deindex[indexBaseName]
  return async doc => {
    if (shouldBeDeindexed(doc)) {
      addToNextBatch('delete', index, doc)
    } else {
      const formattedDoc = await format(doc)
      addToNextBatch('index', index, formattedDoc)
    }
  }
}
