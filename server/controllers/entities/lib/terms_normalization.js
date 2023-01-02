import _ from 'lodash-es'

export const normalizeTerm = term => {
  if (!term) return

  return term
  .toLowerCase()

  // title:
  // - Remove part in parenthesis at then end of a title
  .replace(/\s\([^)]+\)$/, '')
  // - Ignore leading articles as they are a big source of false negative match
  .replace(/^(the|a|le|la|l'|der|die|das)\s/ig, '')

  // Remove punctuations
  .replace(/[:;.]/g, ' ')
  // Replace all groups of spaces that might have emerged above by a single space
  .replace(/\s+/g, ' ')

  .trim()
}

export const getEntityNormalizedTerms = entity => {
  const labels = Object.values(entity.labels)
  const aliases = Object.values(entity.aliases || {}).flat()
  const terms = labels.concat(aliases).map(normalizeTerm)
  return _.uniq(terms)
}
