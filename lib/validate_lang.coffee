__ = require('config').universalPath
validLangs = __.require 'client', 'scripts/valid_langs'

module.exports = (args)->
  if args.length > 0
    if args[0] is 'all' then return validLangs
    else args.forEach checkLang
  else throw new Error "expected at least one 2-letter language code as argument, got 0"

  return args

checkLang = (lang)->
  unless lang in validLangs
    throw new Error "#{lang} isnt a valid lang argument"