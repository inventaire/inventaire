__ = require('config').universalPath
Promise = require 'bluebird'
json_  = __.require 'client', 'scripts/lib/json'
activeFiles  = __.require 'client', 'scripts/lib/active_files'
activeLangs = require '../../active_langs'
count = 0
args = process.argv.slice(2)
total = args.length

i18nSrcActive = activeLangs
i18nTransifexActive = activeFiles './server/lib/emails/i18n/src/transifex'
i18nArchiveActive = activeFiles './server/lib/emails/i18n/src/archive'
i18nClientDistActive = activeFiles './client/public/i18n/dist/'

i18nSrc = (lang)->
  if lang in i18nSrcActive then __.path('i18nSrc', "#{lang}.json")
  else null

i18nTransifex = (lang)->
  if lang in i18nTransifexActive then __.path('i18nTransifex', "#{lang}.json")
  else null

i18nArchive = (lang)->
  if lang in i18nArchiveActive then __.path('i18nArchive', "#{lang}.json")
  else null

i18nClientDist = (lang)->
  if lang in i18nClientDistActive then __.path('i18nClientDist', "#{lang}.json")
  else null

module.exports =
  getSources: (lang)->
    enObj: json_.read i18nSrc('en')
    langCurrent: json_.read i18nSrc(lang)
    langTransifex: json_.read i18nTransifex(lang)
    langArchive: json_.read i18nArchive(lang)
    # use the client key/values has extra inputs to avoid having dupplicates
    # between the client and the server projects
    langExtra: json_.read i18nClientDist(lang)
    markdown: true
    lang: lang

  updateAndArchive: (lang, update, archive)->
    Promise.all [
      json_.write(i18nSrc(lang), update)
      json_.write(i18nArchive(lang), archive)
    ]
    .then -> console.log "#{lang} src updated!".blue
    .catch (err)->
      console.log "couldnt update #{lang} src files", err.stack
      throw err

  writeDistVersion: (lang, dist)->
    json_.write __.path('i18nDist', "#{lang}.json"), dist
    .then ->
      console.log "#{lang} done! total: #{++count}".green
