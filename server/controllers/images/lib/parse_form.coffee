__ = require('config').universalPath
{ IncomingForm } = require 'formidable'
{ Promise } = __.require 'lib', 'promises'

module.exports = (req)->
  form = new IncomingForm()

  return new Promise (resolve, reject)->
    form.parse req, (err, fields, files) ->
      if err? then reject err
      else
        resolve
          fields: fields
          files: files
