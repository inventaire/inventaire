
const { uniq } = require('lodash')

// data: labels or descriptions
module.exports = (lang, originalLang, data) => {
  if (!data) return {}

  const order = getLangPriorityOrder(lang, originalLang, data)

  while (order.length > 0) {
    const nextLang = order.shift()
    const value = data[nextLang]
    if (value != null) return { value, lang: nextLang }
  }

  return {}
}

const getLangPriorityOrder = (lang, originalLang, data) => {
  const order = [ lang ]
  if (originalLang != null) { order.push(originalLang) }
  order.push('en')
  const availableLangs = Object.keys(data)
  return uniq(order.concat(availableLangs))
}
