Promise = require 'bluebird'
fs = Promise.promisifyAll require('graceful-fs')
parse = JSON.parse.bind(JSON)
stringify = (data)-> JSON.stringify data, null, 4

module.exports =
  jsonRead: (path)->
    @type path, 'string'
    require path

  jsonReadAsync: (path)->
    @type path, 'string'
    fs.readFileAsync path, 'utf-8'
    .then parse

  jsonWrite: (path, data)->
    @types arguments, ['string', 'object']
    json = stringify data
    fs.writeFileSync path, json

  jsonWriteAsync: (path)->
    @type path, 'string'
    json = stringify data
    fs.writeFileAsync path, json
