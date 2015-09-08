CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')
Promise = require 'bluebird'
knox = require 'knox'
client = knox.createClient CONFIG.aws

module.exports =
  putImage: (args...)->
    putFile.apply null, args
    .then _.property('req.url')
    .then _.Log('raw url')
    .then extractOwnedUrl

  deleteImages: (urls, headers)->
    urls = urls.map (url)->
      parts = url.split(CONFIG.aws.bucket)
      return parts.last()

    headers or= {}
    return new Promise (resolve, reject)->
      client.deleteMultiple urls, headers, (err, res)->
        if err then reject err
        else resolve res

putFile = (path, filename, type='image/jpeg')->
  headers =
    'x-amz-acl': 'public-read'
    'Content-Type': type

  return new Promise (resolve, reject)->
    client.putFile path, filename, headers, (err, res)->
      if err then reject err
      else resolve res


extractOwnedUrl = (url)->
  parts = url.split CONFIG.aws.bucket
  path = parts.last()
  return "#{CONFIG.aws.protocol}://#{CONFIG.aws.bucket}#{path}"
