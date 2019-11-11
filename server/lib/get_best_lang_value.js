{ uniq } = require 'lodash'

# data: labels or descriptions
module.exports = (lang, originalLang, data)->
  unless data then return {}

  order = getLangPriorityOrder lang, originalLang, data

  while order.length > 0
    nextLang = order.shift()
    value = data[nextLang]
    if value? then return { value, lang: nextLang }

  return {}

getLangPriorityOrder = (lang, originalLang, data)->
  order = [ lang ]
  if originalLang? then order.push originalLang
  order.push 'en'
  availableLangs = Object.keys data
  return uniq order.concat(availableLangs)
