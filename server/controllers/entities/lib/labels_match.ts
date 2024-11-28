import { someMatch } from '#lib/utils/base'
import type { Label } from '#types/entity'

export function haveExactMatch (labels1: Label[], labels2: Label[]) {
  const formattedLabels1 = labels1.map(formatLabel)
  const formattedLabels2 = labels2.map(formatLabel)
  return someMatch(formattedLabels1, formattedLabels2)
}

const formatLabel = label => label.toLowerCase()
