import { someMatch } from '#lib/utils/base'

export const haveExactMatch = (labels1, labels2) => {
  const formattedLabels1 = labels1.map(formatLabel)
  const formattedLabels2 = labels2.map(formatLabel)
  return someMatch(formattedLabels1, formattedLabels2)
}

const formatLabel = label => label.toLowerCase()
