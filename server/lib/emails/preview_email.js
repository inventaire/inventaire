// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// mimicking Nodemailer::sendMail
// to make it render a preview instead of sending an email

const fs = require('fs')
const mailcomposer = require('mailcomposer')

const callbackPromise = function(resolve, reject){
  let cb
  return cb = function(...args){
    const err = args.shift()
    if (err) { return reject(err)
    } else { return resolve.apply(null, args) }
  }
}

module.exports = function(data, callback){
  let promise = undefined

  if (!callback && (typeof Promise === 'function')) {
    promise = new Promise((resolve, reject) => callback = callbackPromise(resolve, reject))
  }

  if (!data) { data = {} }
  if (!data.headers) { data.headers = {} }
  if (!callback) { callback = function() {} }

  // apply defaults
  // Object.keys @_defaults
  // .forEach (key)->
  //   if !(key of data)
  //     data[key] = @_defaults[key]
  //   else if key == 'headers'
  //     # headers is a special case. Allow setting individual default headers
  //     Object.keys @_defaults.headers or {}
  //     .forEach (key)->
  //       unless (key of data.headers) then data.headers[key] = @_defaults.headers[key]
  //     .bind @

  // .bind @

  const mail = {
    data,
    message: null,
    resolveContent: this.resolveContent.bind(this)
  }

  // if typeof @transporter == 'string'
  //   return callback new Error('Unsupported configuration, downgrade Nodemailer to v0.7.1 to use it')

  this._processPlugins('compile', mail, (err)=> {
    if (err) { return callback(err) }
    mail.message = mailcomposer(mail.data)

    // if mail.data.xMailer != false
    //   mail.message.setHeader 'X-Mailer', mail.data.xMailer or @_getVersionString()

    // if mail.data.priority
    //   switch (mail.data.priority or '').toString().toLowerCase()
    //     when 'high'
    //       mail.message.setHeader 'X-Priority', '1 (Highest)'
    //       mail.message.setHeader 'X-MSMail-Priority', 'High'
    //       mail.message.setHeader 'Importance', 'High'
    //     when 'low'
    //       mail.message.setHeader 'X-Priority', '5 (Lowest)'
    //       mail.message.setHeader 'X-MSMail-Priority', 'Low'
    //       mail.message.setHeader 'Importance', 'Low'
    // do not add anything, since all messages are 'Normal' by default

    return this._processPlugins('stream', mail, (err) => {
      if (err) { return callback(err) }
      // you can either be in preview or send mode
      // if preview
      const previewDir = data.previewDir || '/tmp/nodemailer-preview'
      const previewFilename = data.previewFilename || 'index.html'
      const previewFilePath = previewDir + '/' + previewFilename
      const previewDataPath = previewDir + '/data.json'
      if (!fs.existsSync(previewDir)) { fs.mkdirSync(previewDir) }

      console.log('email not sent, updated email preview:', previewFilePath)
      const json = JSON.stringify(mail.data, null, 4)
      let { html } = mail.data
      html = "<p style='text-align:center'><a href='/data.json'>data</a></p>" + html
      fs.writeFile(previewFilePath, html)
      return fs.writeFile(previewDataPath, json, callback)
    })
  })
  // else
  // @transporter.send mail, callback

  return promise
}
