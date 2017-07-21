# mimicking Nodemailer::sendMail
# to make it render a preview instead of sending an email

fs = require 'fs'
mailcomposer = require 'mailcomposer'

callbackPromise = (resolve, reject)->
  cb = (args...)->
    err = args.shift()
    if err then reject err
    else resolve.apply null, args

module.exports = (data, callback)->
  promise = undefined

  if !callback and typeof Promise == 'function'
    promise = new Promise (resolve, reject)->
      callback = callbackPromise resolve, reject

  data or= {}
  data.headers or= {}
  callback or= ->

  # apply defaults
  # Object.keys @_defaults
  # .forEach (key)->
  #   if !(key of data)
  #     data[key] = @_defaults[key]
  #   else if key == 'headers'
  #     # headers is a special case. Allow setting individual default headers
  #     Object.keys @_defaults.headers or {}
  #     .forEach (key)->
  #       unless (key of data.headers) then data.headers[key] = @_defaults.headers[key]
  #     .bind this

  # .bind this

  mail =
    data: data
    message: null
    resolveContent: @resolveContent.bind this

  # if typeof @transporter == 'string'
  #   return callback new Error('Unsupported configuration, downgrade Nodemailer to v0.7.1 to use it')

  @_processPlugins 'compile', mail, (err)=>
    if err then return callback err
    mail.message = mailcomposer mail.data

    # if mail.data.xMailer != false
    #   mail.message.setHeader 'X-Mailer', mail.data.xMailer or @_getVersionString()

    # if mail.data.priority
    #   switch (mail.data.priority or '').toString().toLowerCase()
    #     when 'high'
    #       mail.message.setHeader 'X-Priority', '1 (Highest)'
    #       mail.message.setHeader 'X-MSMail-Priority', 'High'
    #       mail.message.setHeader 'Importance', 'High'
    #     when 'low'
    #       mail.message.setHeader 'X-Priority', '5 (Lowest)'
    #       mail.message.setHeader 'X-MSMail-Priority', 'Low'
    #       mail.message.setHeader 'Importance', 'Low'
        # do not add anything, since all messages are 'Normal' by default

    @_processPlugins 'stream', mail, (err)->
      if err then return callback err
      # you can either be in preview or send mode
      # if preview
      previewDir = data.previewDir or '/tmp/nodemailer-preview'
      previewFilename = data.previewFilename or 'index.html'
      previewFilePath = previewDir + '/' + previewFilename
      previewDataPath = previewDir + '/data.json'
      unless fs.existsSync(previewDir) then fs.mkdirSync previewDir

      console.log 'email not sent, updated email preview:', previewFilePath
      json = JSON.stringify mail.data, null, 4
      { html } = mail.data
      html = "<p style='text-align:center'><a href='/data.json'>data</a></p>" + html
      fs.writeFile previewFilePath, html
      fs.writeFile previewDataPath, json, callback
      # else
        # @transporter.send mail, callback

  return promise
