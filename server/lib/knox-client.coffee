Q = require 'q'
CONFIG = require 'config'
_ = CONFIG.root.require('builders', 'utils')
knox = require 'knox'
client = knox.createClient
  key: CONFIG.aws.key
  secret: CONFIG.aws.secret
  region: CONFIG.aws.region
  bucket: CONFIG.aws.bucket

module.exports =
  putImage: (src, type)->
    deferred = Q.defer()
    headers =
      'x-amz-acl': 'public-read'
      'Content-Type': type
    filename = _.idGenerator(22)
    client.putFile src, "#{filename}.jpg", headers, (err, res)->
      if err then deferred.reject(new Error(err))
      else deferred.resolve(res)

    return deferred.promise

  deleteImages: (filenames, headers)->
    filenames = filenames.map (url)->
      parts = url.split(CONFIG.aws.bucket)
      return parts.last()

    deferred = Q.defer()
    headers ||= {}
    client.deleteMultiple filenames, headers, (err, res)->
      if err then deferred.reject(new Error(err))
      else deferred.resolve(res)

    return deferred.promise