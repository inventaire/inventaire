_ = require 'lodash'
Promise = require 'bluebird'
findKeys = require './find_keys'
{ getSources, updateAndArchive, writeDistVersion } = require './json_files_handlers'

module.exports = extendLangWithDefault = (lang)->
  Promise.all getSources(lang)
  .then (args)->
    rethrowErrors args

    [ dist, update, cleanArchive ] = findKeys.apply null, args

    # console.log 'dist: ', dist
    # console.log 'update: ', update
    # console.log 'cleanArchive: ', cleanArchive

    updateAndArchive lang, update, cleanArchive
    writeDistVersion lang, dist

  .catch (err)-> console.error "#{lang} err".red, err.stack


rethrowErrors = (args)->
  args.forEach (arg)->
    if arg instanceof Error then throw arg
