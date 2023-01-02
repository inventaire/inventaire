import _ from '#builders/utils'

export default slug => {
  const parts = slug.split('.')
  const lastPart = parts.at(-1)
  if (_.isPositiveIntegerString(lastPart)) {
    const next = parseInt(lastPart) + 1
    return `${parts.slice(0, -1).join('.')}.${next}`
  } else {
    return `${slug}.1`
  }
}
