
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')

const normalizeTerm = term => term
.toLowerCase()

// title
// # remove part in parenthesis at then end of a title
.replace(/\s\([^)]+\)$/, '')
// # Ignore leading articles as they are a big source of false negative match
.replace(/^(the|a|le|la|l'|der|die|das)\s/ig, '')

// authors
// # Work around the various author name notations
.replace(/\./g, ' ')
// # Replace all groups of spaces that might have emerged above by a single space
.replace(/\s+/g, ' ')

const getEntityNormalizedTerms = entity => {
  const labels = _.values(entity.labels)
  const aliases = _.flatten(_.values(entity.aliases))
  const terms = labels.concat(aliases).map(normalizeTerm)
  return _.uniq(terms)
}

module.exports = { normalizeTerm, getEntityNormalizedTerms }
