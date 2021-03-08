const __ = require('config').universalPath
const _ = require('builders/utils')

const haveExactMatch = (labels1, labels2) => {
  const formattedLabels1 = labels1.map(formatLabel)
  const formattedLabels2 = labels2.map(formatLabel)
  return _.someMatch(formattedLabels1, formattedLabels2)
}

const formatLabel = label => label.toLowerCase()

module.exports = { haveExactMatch }
