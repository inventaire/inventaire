// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only


const { uniq } = require('lodash')

// data: labels or descriptions
module.exports = (lang, originalLang, data) => {
  if (!data) return {}

  const order = getLangPriorityOrder(lang, originalLang, data)

  while (order.length > 0) {
    const nextLang = order.shift()
    const value = data[nextLang]
    if (value) return { value, lang: nextLang }
  }

  return {}
}

const getLangPriorityOrder = (lang, originalLang, data) => {
  const order = [ lang ]
  if (originalLang) order.push(originalLang)
  order.push('en')
  const availableLangs = Object.keys(data)
  return uniq(order.concat(availableLangs))
}
