Promise = require 'bluebird'
fs = Promise.promisifyAll require('graceful-fs')
parse = JSON.parse.bind(JSON)
stringify = (data)-> JSON.stringify data, null, 4
assert_ = require './assert_types'

module.exports =
  jsonReadAsync: (path)->
    assert_.string path
    fs.readFileAsync path, 'utf-8'
    .then parse

  jsonWrite: (path, data)->
    assert_.types [ 'string', 'object' ], [ path, data ]
    json = stringify data
    fs.writeFileSync path, json
