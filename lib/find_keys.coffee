__ = require('config').root
_ = require 'lodash'
convertMarkdown = __.require 'client', 'scripts/lib/convert_markdown'

module.exports = findKeys = (enObj, langCurrent, langTransifex, langArchive, markdown)->
  langTransifex = keepNonNullValues langTransifex
  langCurrent = keepNonNullValues langCurrent

  # dist will be the language 'dist' version
  # update will replace the previous 'src' version
  # archive will keep keys that werent in the English version)
  langObj = _.extend {}, langArchive, langTransifex, langCurrent
  dist = {}
  update = {}

  for k,enVal of enObj
    langVal = langObj[k]
    if langVal?
      dist[k] = update[k] = langVal
    else
      dist[k] = enVal
      # allows to highlight the missing translations
      # per-languages in the src files
      update[k] = null
    if markdown
      dist[k] = convertMarkdown dist[k]

    archive = _.omit langObj, Object.keys(update)
    # pick keys with non-null value
    cleanArchive = _.pick archive, _.identity

  return [dist, update, cleanArchive]


keepNonNullValues = (obj)-> _.pick obj, (str)-> str?
