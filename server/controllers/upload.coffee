CONFIG = require 'config'
_ = CONFIG.root.require('builders', 'utils')
formidable = require 'formidable'
client = require '../lib/knox-client'
Promise = require 'bluebird'


module.exports.post = (req, res, next)->
  form = new formidable.IncomingForm()
  form.parse req, (err, fields, files) ->
    _.success {
      fields: fields
      files: files
      }, 'form parse'
    if err
      _.log err, 'err'
      res.status(500).json {status: err}
    else
      promises = []
      for k,file of files

        # /tmp/ path
        src = file.path
        type = file.type

        promise = client.putImage(src, type).then (response)->
          _.log response.req.url, 'url?'

        promises.push promise

      Promise.all promises
      .then (urls)->
        _.log urls, 'urls'
        ownedUrls = urls.map extractOwnedUrl
        _.log ownedUrls, 'ownedUrls'
        res.status(200).json ownedUrls
      .catch (err)->
        _.error err, 'putImage err'
        res.status(500).json {status: err}

module.exports.del = (req, res, next)->
  filenames = req.body.urls
  _.success filenames, 'filenames?'
  client.deleteImages(filenames)
  .then (resp)->
    _.log resp.statusCode, 'delete statusCode'
    if resp.statusCode is 200
      res.status(200).json {status: 'OK'}
    else throw {status: 'FAILED'}
  .catch (err)->
    res.status(500).json err


extractOwnedUrl = (url)->
  parts = url.split CONFIG.aws.bucket
  path = parts.last()
  return "#{CONFIG.aws.protocol}://#{CONFIG.aws.bucket}#{path}"