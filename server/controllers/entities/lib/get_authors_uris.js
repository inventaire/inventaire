import _ from 'lodash-es'

const authorProperties = [
  // author
  'wdt:P50',
  // scenarist
  'wdt:P58',
  // illustrator
  'wdt:P110',
  // colorist
  'wdt:P6338'
]

export default work => {
  return _(work.claims)
  .pick(authorProperties)
  .values()
  .flatten()
  .uniq()
  .value()
}
