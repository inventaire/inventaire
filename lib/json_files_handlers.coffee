__ = require('config').root
Promise = require 'bluebird'
json_  = __.require 'client', 'scripts/lib/json'
count = 0
args = process.argv.slice(2)
total = args.length

module.exports =
  getSources: (lang)->
    return [
      json_.read __.path('i18nSrc', 'en.json')
      json_.read __.path('i18nSrc', "#{lang}.json")
      json_.read __.path('i18nTransifex', "#{lang}.json")
      json_.read __.path('i18nArchive', "#{lang}.json")
      true #markdown
    ]

  updateAndArchive: (lang, update, archive)->
    Promise.all [
      json_.write __.path('i18nSrc', "#{lang}.json"), update
      json_.write __.path('i18nArchive', "#{lang}.json"), archive
    ]
    .then -> console.log "#{lang} src updated!".blue
    .catch (err)-> console.log "couldnt update #{lang} src files", err.stack

  writeDistVersion: (lang, dist)->
    json_.write __.path('i18nDist', "#{lang}.json"), dist
    .then ->
      console.log "#{lang} done! total: #{++count}".green
      if count is total then console.timeEnd 'generate'.grey