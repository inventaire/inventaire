#!/usr/bin/env node


// a little script that throws if it isn't passed
// a valid 2-letter language code as first argument
// and does nothing otherwise

const __ = require('config').universalPath
const validLang = __.require('client', 'scripts/valid_langs')

const lang = process.argv[2]
if (!validLang.includes(lang)) {
  throw new Error(`invalid lang: ${lang}`)
}
