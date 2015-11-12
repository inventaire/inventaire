CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

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

defaults =
  from: CONFIG.mailer.defaultFrom
  # pass in preview mode if mailer is disabled
  preview: CONFIG.mailer.disabled

transporter = nodemailer.createTransport CONFIG.mailer, defaults
transporter.use 'compile', hbs(options)

module.exports =
  sendMail: (email)->
    transporter.sendMail email
    .then _.Success('email sent')
    .catch (err)->
      _.error err, 'email error'
      _.warn email, 'associated email'
