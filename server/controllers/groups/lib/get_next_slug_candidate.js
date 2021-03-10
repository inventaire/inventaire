const _ = require('builders/utils')

module.exports = slug => {
  const parts = slug.split('.')
  const lastPart = _.last(parts)
  if (_.isPositiveIntegerString(lastPart)) {
    const next = parseInt(lastPart) + 1
    return `${parts.slice(0, -1).join('.')}.${next}`
  } else {
    return `${slug}.1`
  }
}
