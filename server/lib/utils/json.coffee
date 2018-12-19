Promise = require 'bluebird'
fs = Promise.promisifyAll require('graceful-fs')
parse = JSON.parse.bind(JSON)
stringify = (data)-> JSON.stringify data, null, 4
{ assertType, assertTypes } = require './assert_types'

module.exports =
  jsonReadAsync: (path)->
    assertType path, 'string'
    fs.readFileAsync path, 'utf-8'
    .then parse

  jsonWrite: (path, data)->
    assertTypes arguments, ['string', 'object']
    json = stringify data
    fs.writeFileSync path, json
