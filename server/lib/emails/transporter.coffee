CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

Promise = require 'bluebird'

nodemailer = require 'nodemailer'
hbs = require 'nodemailer-express-handlebars'
handlebarsHelpers = require './handlebars_helpers'
viewsPath = __.path 'lib', 'emails/views'

options =
  viewEngine:
    extname: '.hbs'
    layoutsDir: "#{viewsPath}/layouts/"
    defaultLayout: 'template'
    partialsDir: "#{viewsPath}/partials/"
    helpers: handlebarsHelpers
  viewPath: viewsPath
  extName: '.hbs'

transporter = nodemailer.createTransport CONFIG.mailer
transporter.use 'compile', hbs(options)

# binding context is needed for transporter.sendMail calls to 'this' to work
sendMail = Promise.promisify transporter.sendMail.bind(transporter)

module.exports =
  sendMail: (email)->
    sendMail email
    .then _.Success('email sent')
    .catch (err)->
      _.error err, 'email error'
      _.warn email, 'associated email'
