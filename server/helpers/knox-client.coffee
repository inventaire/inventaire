Q = require 'q'
CONFIG = require 'config'
knox = require 'knox'
client = knox.createClient
  key: CONFIG.aws.key
  secret: CONFIG.aws.secret
  region: CONFIG.aws.region
  bucket: CONFIG.aws.bucket

uuid = require 'prefixed-uuid'


module.exports =
  putImage: (src, type)->
    deferred = Q.defer()
    headers =
      'x-amz-acl': 'public-read'
      'Content-Type': type
    filename = uuid 'inv'
    client.putFile src, "img/#{filename}.jpg", headers, (err, res)->
      if err then deferred.reject(new Error(err))
      else deferred.resolve(res)

    return deferred.promise