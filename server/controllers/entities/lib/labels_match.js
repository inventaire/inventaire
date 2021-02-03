const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const haveExactMatch = (labels1, labels2) => {
  const formattedLabels1 = labels1.map(formatLabel)
  const formattedLabels2 = labels2.map(formatLabel)
  return _.intersection(formattedLabels1, formattedLabels2).length > 0
}

const formatLabel = label => label.toLowerCase()

module.exports = { haveExactMatch }
