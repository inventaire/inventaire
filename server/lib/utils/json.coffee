fs = require 'fs'

module.exports =
  jsonRead: (path)->
    @type path, 'string'
    JSON.parse fs.readFileSync(path).toString()

  jsonWrite: (path, data)->
    @types arguments, ['string', 'object']
    json = JSON.stringify data, null, 4
    fs.writeFileSync(path, json)