#!/usr/bin/env coffee

# HOW TO
# From time to time, you can replace src/fullkey/en by {}
# and browse all the website to regenerate an updated list of the fullkeys

require('./lib/validate_cwd') process.cwd()
require 'colors'
Promise = require 'bluebird'
extendLangWithDefault = require './lib/extend_lang_with_default'

args = process.argv.slice(2)
langs = require('./lib/validate_lang') args

console.time 'generate'.grey

Promise.resolve()
.then -> langs.forEach extendLangWithDefault
.catch (err)-> console.log 'global err'.red, err.stack
