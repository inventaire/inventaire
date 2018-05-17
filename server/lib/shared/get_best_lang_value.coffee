getBestLangValue = null

module.exports = (_)->
  # Initialize it once and always return the same function on next calls
  # Once it made it's closure on _
  if getBestLangValue then return getBestLangValue

  # data: labels or descriptions
  getBestLangValue = (lang, originalLang, data)->
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
    return _.uniq order.concat(availableLangs)

  return getBestLangValue
