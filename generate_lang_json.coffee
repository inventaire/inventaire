#!/usr/bin/env coffee

# HOW TO
# From time to time, you can replace src/fullkey/en by {}
# and browse all the website to regenerate an updated list of the fullkeys

unless /inventaire$/.test process.cwd()
  throw new Error 'this script should be run from the /inventaire/ folder'

__ = require('config').root

validLangs = __.require 'client', 'scripts/valid_langs'
args = process.argv.slice(2)

checkLang = (lang)->
  unless lang in validLangs
    throw new Error "#{lang} isnt a valid lang argument"

if args.length > 0
  if args[0] is 'all' then args = validLangs
  else args.forEach checkLang
else throw new Error "expected at least one 2-letter language code as argument, got 0"

require 'colors'
Promise = require 'bluebird'
pluckSettled = (results)-> _.pluck results, '_settledValue'
_ = require 'lodash'

json_  = __.require 'client', 'scripts/lib/json'


extendLangWithDefault = (lang)->
  Promise.settle getSources(lang)
  .then pluckSettled
  .spread (args...)->
    rethrowErrors(args)


    [ dist, update, cleanArchive ] = findKeys.apply null, args

    console.log 'dist: ', dist
    console.log 'update: ', update
    console.log 'cleanArchive: ', cleanArchive

    updateAndArchive lang, update, cleanArchive
    writeDistVersion lang, dist

  .catch (err)-> console.error "#{lang} err".red, err.stack

rethrowErrors = (args)->
  args.forEach (arg)->
    if arg instanceof Error then throw arg

getSources = (lang)->
  return [
    json_.read __.path('i18nSrc', 'en.json')
    json_.read __.path('i18nSrc', "#{lang}.json")
    json_.read __.path('i18nArchive', "#{lang}.json")
    true #markdown
  ]

convertMarkdown = __.require 'client', 'scripts/lib/convert_markdown'

findKeys = (enObj, langCurrent, langArchive, markdown)->
  # dist will be the language 'dist' version
  # update will replace the previous 'src' version
  # archive will keep keys that werent in the English version)
  langObj = _.extend {}, langCurrent, langArchive
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

updateAndArchive = (lang, update, archive)->
  Promise.all [
    json_.write __.path('i18nSrc', "#{lang}.json"), update
    json_.write __.path('i18nArchive', "#{lang}.json"), archive
  ]
  .then -> console.log "#{lang} src updated!".blue
  .catch (err)-> console.log "couldnt update #{lang} src files", err.stack

count = 0
total = args.length
writeDistVersion = (lang, dist)->
  json_.write __.path('i18nDist', "#{lang}.json"), dist
  .then ->
    console.log "#{lang} done! total: #{++count}".green
    if count is total then console.timeEnd 'generate'.grey


console.time 'generate'.grey
Promise.resolve()
.then -> args.forEach extendLangWithDefault
.catch (err)-> console.log 'global err'.red, err.stack
