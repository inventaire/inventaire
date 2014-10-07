formidable = require 'formidable'
client = require '../helpers/knox-client'
Q = require 'q'

module.exports.post = (req, res, next)->
  form = new formidable.IncomingForm()
  form.parse req, (err, fields, files) ->
    _.logGreen {
        fields: fields
        files: files
        }, 'form parse'
    if err
      _.log err, 'err'
      res.json 500, {status: err}
    else
      promises = []
      for k,file of files

        # /tmp/ path
        src = file.path
        type = file.type

        promise = client.putImage(src, type)
        .then (response)-> _.logYellow response.req.url, 'url?'

        promises.push promise

      Q.all promises
      .then (urls)->
        _.logYellow urls, 'urls'
        res.json 200, urls
      .fail (err)->
        _.logRed err, 'putImage err'
        res.json 500, {status: err}