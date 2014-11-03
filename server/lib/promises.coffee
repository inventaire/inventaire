breq = require 'breq'

module.exports =
  get: (url)-> breq.get(url).then (res)-> res.body