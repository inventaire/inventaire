import { uniq } from 'lodash-es'

// data: labels or descriptions
export function getBestLangValue (lang, originalLang, data) {
  if (!data) return {}

  const order = getLangPriorityOrder(lang, originalLang, data)

  while (order.length > 0) {
    const nextLang = order.shift()
    const value = data[nextLang]
    if (value) return { value, lang: nextLang }
  }

  return {}
}

function getLangPriorityOrder (lang, originalLang, data) {
  const order = [ lang, 'mul' ]
  if (originalLang) order.push(originalLang)
  order.push('en')
  const availableLangs = Object.keys(data)
  return uniq(order.concat(availableLangs))
}
