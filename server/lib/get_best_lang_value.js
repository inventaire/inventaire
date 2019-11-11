// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { uniq } = require('lodash')

// data: labels or descriptions
module.exports = function(lang, originalLang, data){
  if (!data) return {}

  const order = getLangPriorityOrder(lang, originalLang, data)

  while (order.length > 0) {
    const nextLang = order.shift()
    const value = data[nextLang]
    if (value != null) return { value, lang: nextLang }
  }

  return {}
}

var getLangPriorityOrder = function(lang, originalLang, data){
  const order = [ lang ]
  if (originalLang != null) { order.push(originalLang) }
  order.push('en')
  const availableLangs = Object.keys(data)
  return uniq(order.concat(availableLangs))
}
