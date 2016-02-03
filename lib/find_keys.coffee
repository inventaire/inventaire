__ = require('config').universalPath
_ = require 'lodash'

linkify = __.require 'client', 'app/lib/handlebars_helpers/linkify'
convertMarkdown = require('./convert_markdown')(linkify)

module.exports = findKeys = (params)->
  { enObj, langCurrent, langTransifex, langArchive, langExtra, markdown, lang } = params

  # extra are typically translation files from another subproject:
  # for instance, emails key/values are kept DRY by using the client's dist key/values
  hasExtra = langExtra?
  langIsEnglish = lang is 'en'

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
      if hasExtra
        extraVal = langExtra[k]
        if extraVal?
          console.log "importing extra val: #{k}".green, extraVal
          dist[k] = extraVal
          # Do not set update[k] = null for non-English langs as extra values should not appear
          # in their source files given extra values are meant to avoid dupplicates between projects.
          # Those null values should appear in English though, so that
          # enObj keeps track of it, forcing findKeys to look for it.
          # Those keys wont appear in Transifex as it takes a transifexified version of enObj as input,
          # that is, enObj without the null values
          if langIsEnglish then update[k] = null
        else
          dist[k] = enVal
          update[k] = null
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
