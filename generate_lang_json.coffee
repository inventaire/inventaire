#!/usr/bin/env coffee

# HOW TO
# From time to time, you can replace src/fullkey/en by {}
# and browse all the website to regenerate an updated list of the fullkeys

# Command: cd ~/inventaire && ./server/lib/emails/i18n/src/generate_lang_json.coffee all

require 'colors'
console.time 'total'.grey
require('./lib/validate_cwd') process.cwd()
Promise = require 'bluebird'
extendLangWithDefault = require './lib/extend_lang_with_default'

args = process.argv.slice(2)
langs = require('./lib/validate_lang') args

console.time 'generate'.grey

Promise.all langs.map(extendLangWithDefault)
.then ->
  console.timeEnd 'generate'.grey
  console.timeEnd 'total'.grey
.catch (err)-> console.log 'global err'.red, err.stack
