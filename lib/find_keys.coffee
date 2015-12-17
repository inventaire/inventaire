__ = require('config').universalPath
_ = require 'lodash'

linkify = __.require 'client' 'app/lib/handlebars_helpers/linkify'
convertMarkdown = require('./convert_markdown')(linkify)

module.exports = findKeys = (enObj, langCurrent, langTransifex, langArchive, markdown)->
  langTransifex = formatTransifexValues langTransifex, enObj
  langCurrent = keepNonNullValues langCurrent

  # Aggregate values from all available source,
  # with priority given to the local 'src' file
  # then the local 'archive' file
  # then the Transifex export
  langObj = _.extend {}, langTransifex, langArchive, langCurrent
  # dist will be the language 'dist' version
  dist = {}
  # update will replace the previous 'src' version
  update = {}

  for k, enVal of enObj
    langVal = langObj[k]
    if langVal?
      dist[k] = langVal
      # Push the value to the source file
      # only if it differs from the English version
      if langVal isnt enVal then update[k] = langVal
      # If it is the English version, keep the current version instead,
      # which can be the English version if it's really what is desired
      else update[k] = langCurrent[k]
    else
      dist[k] = enVal
      # allows to highlight the missing translations
      # per-languages in the src files
      update[k] = null
    if markdown
      dist[k] = convertMarkdown dist[k]

    # archive will keep keys that weren't in the English version
    archive = _.omit langObj, Object.keys(update)
    # pick keys with non-null value
    cleanArchive = _.pick archive, _.identity

  return [dist, update, cleanArchive]


formatTransifexValues = (langTransifex={}, enObj)->
  langTransifex = keepNonNullValues langTransifex
  invertedEnObj = _.invert enObj
  formattedLangTransifex = {}
  for k,v of langTransifex
    realKey = invertedEnObj[k]
    # transifex uses the English version as value
    # while we want it to stay 'null' to highligh that the value is missing
    if realKey? and v isnt enObj[realKey]
      formattedLangTransifex[realKey] = v

  return formattedLangTransifex

keepNonNullValues = (obj)-> _.pick obj, (str)-> str?
