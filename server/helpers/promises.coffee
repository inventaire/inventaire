qreq = require 'qreq'

module.exports =
  get: (url)-> qreq.get(url).then (res)-> res.body